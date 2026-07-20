
-- New sequence + generator for application numbers (APP{YYYY}{00001})
CREATE SEQUENCE IF NOT EXISTS public.application_no_seq START 1;

CREATE OR REPLACE FUNCTION public.next_application_no()
RETURNS text
LANGUAGE sql
SET search_path = public
AS $$
  SELECT 'APP' || to_char(now(),'YYYY') || lpad(nextval('public.application_no_seq')::text, 5, '0');
$$;

-- Add new columns to admissions
ALTER TABLE public.admissions
  ADD COLUMN IF NOT EXISTS application_no text UNIQUE DEFAULT public.next_application_no(),
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS alternate_mobile text,
  ADD COLUMN IF NOT EXISTS aadhaar_number text,
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preferred_timing text,
  ADD COLUMN IF NOT EXISTS remarks text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS aadhaar_front_url text,
  ADD COLUMN IF NOT EXISTS aadhaar_back_url text,
  ADD COLUMN IF NOT EXISTS qualification_url text,
  ADD COLUMN IF NOT EXISTS passport_photo_url text;

-- Backfill application_no for existing rows
UPDATE public.admissions SET application_no = public.next_application_no() WHERE application_no IS NULL;

-- Unique aadhaar (allow null) to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uniq_admissions_aadhaar ON public.admissions(aadhaar_number) WHERE aadhaar_number IS NOT NULL;

-- Storage policies for `documents` bucket, scoped to admissions/ folder
DROP POLICY IF EXISTS "Public upload admission docs" ON storage.objects;
CREATE POLICY "Public upload admission docs"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'admissions');

DROP POLICY IF EXISTS "Staff read admission docs" ON storage.objects;
CREATE POLICY "Staff read admission docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = 'admissions'
    AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'))
  );
