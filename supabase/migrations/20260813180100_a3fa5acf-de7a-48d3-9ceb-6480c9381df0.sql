-- Security Hardening: Revoke default execute on all functions from PUBLIC
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Re-grant execute to roles for functions that need them

-- 1. Functions that MUST be available to anonymous users (Public Admission)
GRANT EXECUTE ON FUNCTION public.submit_admission(jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.super_admin_exists() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_super_admin(text, text, text, text) TO anon, authenticated, service_role; -- Needs to be public for setup

-- 2. Functions for Authenticated users only
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_branch_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_my_student_profile(text, text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_material_download() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.student_can_see_material(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.role_of(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_logout() TO authenticated, service_role;

-- 3. Administrative / Trigger / Internal Functions (Internal/Service Role)
GRANT EXECUTE ON FUNCTION public.admin_assign_role(uuid, app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_approve_user(uuid, app_role, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_material_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated, service_role;

-- Sequence/Autofill Functions
GRANT EXECUTE ON FUNCTION public.teachers_autofill() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_teacher_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_employee_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_course_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_batch_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recount_batch_strength() TO authenticated, service_role;

-- Trigger Functions (usually called by system, but service_role can call)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_login() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_material_published() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_certificate_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_result_published() TO service_role;
GRANT EXECUTE ON FUNCTION public.guard_user_roles() TO service_role;
