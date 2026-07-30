CREATE OR REPLACE FUNCTION public.claim_super_admin(
  _full_name text,
  _phone text,
  _institute_name text,
  _branch_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _branch_id uuid;
  _code text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to complete setup';
  END IF;

  IF public.super_admin_exists() THEN
    RAISE EXCEPTION 'Setup has already been completed. An approved Super Admin already exists.';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _uid;

  IF _branch_name IS NOT NULL AND length(trim(_branch_name)) > 0 THEN
    SELECT id INTO _branch_id FROM public.branches WHERE name ILIKE trim(_branch_name) LIMIT 1;
    IF _branch_id IS NULL THEN
      _code := upper(regexp_replace(trim(_branch_name), '[^a-zA-Z0-9]', '', 'g'));
      _code := COALESCE(NULLIF(left(_code, 6), ''), 'MAIN');
      INSERT INTO public.branches (name, code) VALUES (trim(_branch_name), _code)
      RETURNING id INTO _branch_id;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, branch_id, status, requested_role, approved_at)
  VALUES (_uid, _email, _full_name, _phone, _branch_id, 'approved', 'super_admin', now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    branch_id = COALESCE(EXCLUDED.branch_id, public.profiles.branch_id),
    status = 'approved',
    requested_role = 'super_admin',
    approved_at = now();

  DELETE FROM public.user_roles WHERE user_id = _uid;
  INSERT INTO public.user_roles (user_id, role, branch_id) VALUES (_uid, 'super_admin', _branch_id);

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, meta)
  VALUES (_uid, _email, 'setup.super_admin.created', 'profiles', _uid,
          jsonb_build_object('institute_name', _institute_name, 'branch', _branch_name, 'via', 'claim_super_admin'));

  RETURN jsonb_build_object('ok', true, 'user_id', _uid, 'email', _email);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_super_admin(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_super_admin(text, text, text, text) TO authenticated;