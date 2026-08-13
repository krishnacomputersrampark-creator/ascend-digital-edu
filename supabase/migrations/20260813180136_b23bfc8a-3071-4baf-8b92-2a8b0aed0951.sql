-- Specifically target functions that should NOT be public
REVOKE ALL ON FUNCTION public.admin_assign_role(uuid, app_role, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_approve_user(uuid, app_role, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_status(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_material_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_user_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_user_roles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Re-grant to authenticated/service_role
GRANT EXECUTE ON FUNCTION public.admin_assign_role(uuid, app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_approve_user(uuid, app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_material_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.guard_user_roles() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
