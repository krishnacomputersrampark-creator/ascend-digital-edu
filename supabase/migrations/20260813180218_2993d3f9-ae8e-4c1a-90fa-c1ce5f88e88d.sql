-- Comprehensive security hardening: Revoking public execution on sensitive functions
-- We do this in one migration to ensure all changes are applied together.

-- First, ensure default execution is revoked from PUBLIC for new functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Revoke execute on specific sensitive SECURITY DEFINER functions from PUBLIC (which includes anon)
REVOKE EXECUTE ON FUNCTION public.admin_assign_role(uuid, app_role, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_approve_user(uuid, app_role, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_material_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_user_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_user_roles() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_login() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_material_published() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_certificate_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_result_published() FROM PUBLIC;

-- Re-grant execute to specific roles that require it
GRANT EXECUTE ON FUNCTION public.admin_assign_role(uuid, app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_approve_user(uuid, app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_material_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated, service_role;

-- Strictly internal functions for service_role only
GRANT EXECUTE ON FUNCTION public.guard_user_roles() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_login() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_material_published() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_certificate_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_result_published() TO service_role;
