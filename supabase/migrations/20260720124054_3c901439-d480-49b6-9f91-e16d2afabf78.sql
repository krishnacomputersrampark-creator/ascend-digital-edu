
ALTER FUNCTION public.calc_grade(numeric) SET search_path = public;
ALTER FUNCTION public.calc_division(numeric) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.notify_result_published() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.student_results_autofill() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.result_details_autofill() FROM public, anon, authenticated;
