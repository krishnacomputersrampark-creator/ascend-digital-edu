ALTER TABLE public.certificate_templates
  DROP CONSTRAINT certificate_templates_created_by_fkey,
  ADD CONSTRAINT certificate_templates_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.certificates
  DROP CONSTRAINT certificates_issued_by_fkey,
  ADD CONSTRAINT certificates_issued_by_fkey
    FOREIGN KEY (issued_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.fee_installments
  DROP CONSTRAINT fee_installments_collected_by_fkey,
  ADD CONSTRAINT fee_installments_collected_by_fkey
    FOREIGN KEY (collected_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.fee_structure
  DROP CONSTRAINT fee_structure_created_by_fkey,
  ADD CONSTRAINT fee_structure_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.student_fees
  DROP CONSTRAINT student_fees_created_by_fkey,
  ADD CONSTRAINT student_fees_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.guard_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _sa_count int;
  _actor uuid := auth.uid();
  _parent_user_exists boolean;
BEGIN
  SELECT count(*) INTO _sa_count
  FROM public.user_roles
  WHERE role = 'super_admin';

  IF TG_OP IN ('INSERT','UPDATE') AND NEW.role = 'super_admin' THEN
    IF _actor IS NOT NULL AND _sa_count > 0 AND NOT public.has_role(_actor,'super_admin') THEN
      RAISE EXCEPTION 'Only a Super Admin can grant the Super Admin role';
    END IF;
  END IF;

  IF TG_OP IN ('UPDATE','DELETE') AND OLD.role = 'super_admin' THEN
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id)
      INTO _parent_user_exists;

    -- A cascading child-row delete runs after the parent auth.users row has
    -- already been removed. Permit only that case; manual role deletion and
    -- demotion continue to protect the final Super Admin.
    IF TG_OP = 'DELETE' AND NOT _parent_user_exists THEN
      RETURN OLD;
    END IF;

    IF _sa_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last Super Admin';
    END IF;
    IF _actor IS NOT NULL AND OLD.user_id = _actor THEN
      RAISE EXCEPTION 'You cannot change your own Super Admin role';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$function$;