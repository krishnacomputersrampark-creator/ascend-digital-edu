-- Aggressive revocation for all sensitive functions identified as still public
REVOKE EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_material_download() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_user_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_logout() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_batch_code() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_course_code() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_employee_code() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_teacher_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recount_batch_strength() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.role_of(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.student_can_see_material(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.teachers_autofill() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_my_student_profile(text, text, text, text, text, text, text, text, text, text, text, text, text) FROM anon, PUBLIC;

-- Re-grant only to authenticated
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_material_download() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_logout() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_batch_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_course_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_employee_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_teacher_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recount_batch_strength() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.role_of(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.student_can_see_material(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teachers_autofill() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_my_student_profile(text, text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated, service_role;
