-- Hardening the remaining SECURITY DEFINER functions flagged by the linter
-- We have successfully revoked from anon on the high-risk admin functions.
-- Now we process the rest of the identified functions.

-- Revoke from PUBLIC (including anon)
REVOKE EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_user_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.teachers_autofill() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_teacher_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_employee_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_course_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_batch_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recount_batch_strength() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_branch_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_my_student_profile(text, text, text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_material_download() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.student_can_see_material(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.role_of(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_logout() FROM PUBLIC;

-- Re-grant execute to authenticated role (and service_role)
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teachers_autofill() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_teacher_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_employee_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_course_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_batch_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recount_batch_strength() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_branch_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_my_student_profile(text, text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_material_download() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.student_can_see_material(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.role_of(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_logout() TO authenticated, service_role;
