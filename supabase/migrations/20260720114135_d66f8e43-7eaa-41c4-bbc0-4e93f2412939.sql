
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS alternate_mobile text,
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS aadhaar_number text;

CREATE OR REPLACE FUNCTION public.update_my_student_profile(
  _phone text,
  _alternate_mobile text,
  _email text,
  _address text,
  _city text,
  _state text,
  _pincode text,
  _emergency_contact text,
  _guardian_name text,
  _guardian_phone text,
  _blood_group text,
  _occupation text,
  _photo_url text
) RETURNS public.students
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.students;
BEGIN
  UPDATE public.students SET
    phone = COALESCE(NULLIF(_phone,''), phone),
    alternate_mobile = _alternate_mobile,
    email = NULLIF(_email,''),
    address = _address,
    city = _city,
    state = _state,
    pincode = _pincode,
    emergency_contact = _emergency_contact,
    guardian_name = _guardian_name,
    guardian_phone = _guardian_phone,
    blood_group = _blood_group,
    occupation = _occupation,
    photo_url = COALESCE(_photo_url, photo_url),
    updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'No student record linked to current user';
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_my_student_profile(
  text, text, text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

-- Storage policies for student-photos bucket (per-user folder = auth uid)
DROP POLICY IF EXISTS "Students upload own photo" ON storage.objects;
DROP POLICY IF EXISTS "Students update own photo" ON storage.objects;
DROP POLICY IF EXISTS "Students delete own photo" ON storage.objects;
DROP POLICY IF EXISTS "Students view own photo" ON storage.objects;

CREATE POLICY "Students upload own photo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students update own photo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students delete own photo"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students view own photo"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-photos' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
      OR public.has_role(auth.uid(), 'branch_manager')
      OR public.has_role(auth.uid(), 'faculty')
    )
  );
