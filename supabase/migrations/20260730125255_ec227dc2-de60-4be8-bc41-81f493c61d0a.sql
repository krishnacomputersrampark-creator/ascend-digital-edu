CREATE OR REPLACE FUNCTION public.super_admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'super_admin'
      AND p.status = 'approved'
  );
$$;

GRANT EXECUTE ON FUNCTION public.super_admin_exists() TO anon, authenticated, service_role;