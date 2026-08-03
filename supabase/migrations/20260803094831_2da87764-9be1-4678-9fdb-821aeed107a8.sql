
DELETE FROM public.admissions WHERE full_name IN ('RPC Test','T Anon','T Anon2');

CREATE OR REPLACE FUNCTION public.submit_admission(payload jsonb)
RETURNS TABLE (id uuid, admission_no text, application_no text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean jsonb;
  cols text;
BEGIN
  clean := payload
    - 'id' - 'status' - 'student_id' - 'reviewed_by' - 'reviewed_at'
    - 'approved_by' - 'approved_at' - 'rejected_by' - 'rejected_at'
    - 'admission_no' - 'application_no' - 'created_at' - 'updated_at';

  SELECT string_agg(quote_ident(c.column_name), ', ')
    INTO cols
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'admissions'
    AND c.is_generated = 'NEVER'
    AND clean ? c.column_name;

  IF cols IS NULL THEN
    RAISE EXCEPTION 'No valid application fields provided';
  END IF;

  RETURN QUERY EXECUTE format(
    'INSERT INTO public.admissions (%s, status) SELECT %s, ''pending'' FROM jsonb_populate_record(NULL::public.admissions, $1) RETURNING admissions.id, admissions.admission_no, admissions.application_no',
    cols, cols
  ) USING clean;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_admission(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_admission(jsonb) TO anon, authenticated, service_role;
