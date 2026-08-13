-- Attempting revocation with explicit identification of overloaded functions if necessary
-- Some of these might have multiple signatures

REVOKE EXECUTE ON FUNCTION public.admin_assign_role(uuid, app_role, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_approve_user(uuid, app_role, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_material_admin(uuid) FROM anon, authenticated, PUBLIC;

-- Re-grant ONLY to what is needed
GRANT EXECUTE ON FUNCTION public.admin_assign_role(uuid, app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_approve_user(uuid, app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_material_admin(uuid) TO authenticated, service_role;

-- Verification query within the same migration to check state
DO $$
BEGIN
    IF has_function_privilege('anon', 'public.admin_assign_role(uuid, app_role, uuid)', 'EXECUTE') THEN
        RAISE NOTICE 'ANON STILL HAS EXECUTE ON admin_assign_role';
    ELSE
        RAISE NOTICE 'ANON EXECUTE REVOKED ON admin_assign_role';
    END IF;
END $$;
