
-- 1. Profile approval fields ------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requested_role public.app_role NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS last_login timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid;

UPDATE public.profiles SET status = 'approved' WHERE status NOT IN ('pending','approved','rejected','suspended','inactive');

ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_chk;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_chk
  CHECK (status IN ('pending','approved','rejected','suspended','inactive'));

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 2. Helper: role of any user ------------------------------------------------
CREATE OR REPLACE FUNCTION public.role_of(_uid uuid)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _uid
  ORDER BY CASE role
    WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 WHEN 'branch_manager' THEN 3
    WHEN 'faculty' THEN 4 WHEN 'student' THEN 5 ELSE 6 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'super_admin') OR public.has_role(_uid,'admin');
$$;

-- 3. user_profiles view ------------------------------------------------------
DROP VIEW IF EXISTS public.user_profiles;
CREATE VIEW public.user_profiles WITH (security_invoker = on) AS
SELECT
  p.id,
  p.id AS auth_user_id,
  p.full_name,
  p.email,
  p.phone AS mobile,
  p.photo_url,
  public.role_of(p.id) AS role,
  p.requested_role,
  p.status,
  p.branch_id,
  p.created_by,
  p.approved_by,
  p.approved_at,
  p.rejection_reason,
  p.last_login,
  p.created_at,
  p.updated_at
FROM public.profiles p;

GRANT SELECT ON public.user_profiles TO authenticated;

-- 4. Notifications addressed to a user account --------------------------------
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

DROP POLICY IF EXISTS "Recipients view notifications" ON public.notifications;
CREATE POLICY "Recipients view notifications" ON public.notifications
FOR SELECT TO authenticated USING (
  has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin')
  OR (user_id IS NOT NULL AND user_id = auth.uid())
  OR (target_role IS NOT NULL AND has_role(auth.uid(), target_role))
  OR (student_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = notifications.student_id AND s.user_id = auth.uid()))
  OR (branch_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.branch_id = notifications.branch_id))
  OR (user_id IS NULL AND student_id IS NULL AND branch_id IS NULL AND target_role IS NULL)
);

-- 5. Privilege escalation guard on user_roles ----------------------------------
CREATE OR REPLACE FUNCTION public.guard_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _sa_count int; _actor uuid := auth.uid();
BEGIN
  SELECT count(*) INTO _sa_count FROM public.user_roles WHERE role = 'super_admin';

  IF TG_OP IN ('INSERT','UPDATE') AND NEW.role = 'super_admin' THEN
    IF _actor IS NOT NULL AND _sa_count > 0 AND NOT public.has_role(_actor,'super_admin') THEN
      RAISE EXCEPTION 'Only a Super Admin can grant the Super Admin role';
    END IF;
  END IF;

  IF TG_OP IN ('UPDATE','DELETE') AND OLD.role = 'super_admin' THEN
    IF _sa_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last Super Admin';
    END IF;
    IF _actor IS NOT NULL AND OLD.user_id = _actor THEN
      RAISE EXCEPTION 'You cannot change your own Super Admin role';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_user_roles ON public.user_roles;
CREATE TRIGGER trg_guard_user_roles
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.guard_user_roles();

-- 6. Registration hook: pending by default -------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, status, requested_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    'pending',
    'student'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'guest')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, meta)
  VALUES (NEW.id, NEW.email, 'user.registered', 'profiles', NEW.id, jsonb_build_object('source','signup'));

  RETURN NEW;
END $$;

-- 7. Admin actions ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_user_status(_uid uuid, _status text, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _email text;
BEGIN
  IF NOT public.is_user_admin(_actor) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _uid = _actor THEN RAISE EXCEPTION 'You cannot change your own status'; END IF;
  IF _status NOT IN ('pending','approved','rejected','suspended','inactive') THEN
    RAISE EXCEPTION 'Invalid status %', _status;
  END IF;
  IF public.has_role(_uid,'super_admin') AND NOT public.has_role(_actor,'super_admin') THEN
    RAISE EXCEPTION 'Only a Super Admin can modify a Super Admin';
  END IF;

  UPDATE public.profiles SET
    status = _status,
    rejection_reason = CASE WHEN _status = 'rejected' THEN _reason ELSE NULL END,
    approved_by = CASE WHEN _status = 'approved' THEN _actor ELSE approved_by END,
    approved_at = CASE WHEN _status = 'approved' THEN now() ELSE approved_at END,
    updated_at = now()
  WHERE id = _uid
  RETURNING email INTO _email;

  IF _email IS NULL AND NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, meta)
  VALUES (_actor, (SELECT email FROM public.profiles WHERE id = _actor), 'user.status.' || _status, 'profiles', _uid,
          jsonb_build_object('status', _status, 'reason', _reason));

  INSERT INTO public.notifications (title, description, type, user_id, link)
  VALUES (
    CASE _status
      WHEN 'approved' THEN 'Your account has been approved'
      WHEN 'rejected' THEN 'Your account request was rejected'
      WHEN 'suspended' THEN 'Your account has been suspended'
      WHEN 'inactive' THEN 'Your account has been deactivated'
      ELSE 'Your account status changed' END,
    COALESCE(_reason, 'Your account status is now ' || _status || '.'),
    'account_status', _uid, '/dashboard'
  );
END $$;

CREATE OR REPLACE FUNCTION public.admin_assign_role(_uid uuid, _role public.app_role, _branch uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _old public.app_role;
BEGIN
  IF NOT public.is_user_admin(_actor) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _uid = _actor THEN RAISE EXCEPTION 'You cannot change your own role'; END IF;
  IF (_role = 'super_admin' OR public.has_role(_uid,'super_admin')) AND NOT public.has_role(_actor,'super_admin') THEN
    RAISE EXCEPTION 'Only a Super Admin can manage Super Admin roles';
  END IF;
  IF public.has_role(_uid,'super_admin') AND _role <> 'super_admin'
     AND (SELECT count(*) FROM public.user_roles WHERE role = 'super_admin') <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last Super Admin';
  END IF;

  _old := public.role_of(_uid);
  DELETE FROM public.user_roles WHERE user_id = _uid;
  INSERT INTO public.user_roles (user_id, role, branch_id) VALUES (_uid, _role, _branch);
  UPDATE public.profiles SET branch_id = COALESCE(_branch, branch_id), updated_at = now() WHERE id = _uid;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, meta)
  VALUES (_actor, (SELECT email FROM public.profiles WHERE id = _actor), 'user.role.changed', 'user_roles', _uid,
          jsonb_build_object('from', _old, 'to', _role, 'branch_id', _branch));
END $$;

CREATE OR REPLACE FUNCTION public.admin_approve_user(_uid uuid, _role public.app_role DEFAULT 'student', _branch uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_assign_role(_uid, _role, _branch);
  PERFORM public.admin_set_user_status(_uid, 'approved', NULL);
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid();
BEGIN
  IF NOT public.is_user_admin(_actor) THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF _uid = _actor THEN RAISE EXCEPTION 'You cannot delete your own account'; END IF;
  IF public.has_role(_uid,'super_admin') THEN
    IF NOT public.has_role(_actor,'super_admin') THEN RAISE EXCEPTION 'Only a Super Admin can delete a Super Admin'; END IF;
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'super_admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot delete the last Super Admin';
    END IF;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _uid;
  DELETE FROM public.profiles WHERE id = _uid;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, meta)
  VALUES (_actor, (SELECT email FROM public.profiles WHERE id = _actor), 'user.deleted', 'profiles', _uid, '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.record_login()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _status text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.profiles SET last_login = now() WHERE id = _uid RETURNING status INTO _status;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, meta)
  VALUES (_uid, (SELECT email FROM public.profiles WHERE id = _uid), 'user.login', 'profiles', _uid, jsonb_build_object('status', _status));
  RETURN COALESCE(_status, 'pending');
END $$;

CREATE OR REPLACE FUNCTION public.log_logout()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, meta)
  VALUES (_uid, (SELECT email FROM public.profiles WHERE id = _uid), 'user.logout', 'profiles', _uid, '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.super_admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin');
$$;

GRANT EXECUTE ON FUNCTION public.role_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_role(uuid, public.app_role, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_user(uuid, public.app_role, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_login() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_logout() TO authenticated;
GRANT EXECUTE ON FUNCTION public.super_admin_exists() TO authenticated, anon;
