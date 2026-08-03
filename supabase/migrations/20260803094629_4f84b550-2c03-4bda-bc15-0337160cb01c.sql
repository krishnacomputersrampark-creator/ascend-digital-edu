
DELETE FROM public.admissions WHERE phone IN ('9000000001','9000000002') AND full_name LIKE 'T Anon%';

CREATE OR REPLACE FUNCTION public.submit_admission(payload jsonb)
RETURNS TABLE (id uuid, admission_no text, application_no text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean jsonb;
BEGIN
  clean := payload
    - 'id' - 'status' - 'student_id' - 'reviewed_by' - 'reviewed_at'
    - 'approved_by' - 'approved_at' - 'rejected_by' - 'rejected_at'
    - 'admission_no' - 'application_no' - 'created_at' - 'updated_at';

  RETURN QUERY
  INSERT INTO public.admissions
  SELECT * FROM jsonb_populate_record(
    NULL::public.admissions,
    clean || jsonb_build_object('status', 'pending')
  )
  RETURNING public.admissions.id, public.admissions.admission_no, public.admissions.application_no;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_admission(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_admission(jsonb) TO anon, authenticated, service_role;
