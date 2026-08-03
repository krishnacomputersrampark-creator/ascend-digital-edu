
ALTER TABLE public.admissions
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS board text,
  ADD COLUMN IF NOT EXISTS passing_year text,
  ADD COLUMN IF NOT EXISTS percentage numeric(5,2),
  ADD COLUMN IF NOT EXISTS session text,
  ADD COLUMN IF NOT EXISTS marksheet_url text,
  ADD COLUMN IF NOT EXISTS other_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS documents_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS documents_requested_note text;

UPDATE public.admissions SET father_name = guardian_name WHERE father_name IS NULL AND guardian_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_branch ON public.admissions(branch_id);
CREATE INDEX IF NOT EXISTS idx_admissions_course ON public.admissions(course_id);
CREATE INDEX IF NOT EXISTS idx_admissions_created_at ON public.admissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admissions_phone ON public.admissions(phone);
CREATE INDEX IF NOT EXISTS idx_admissions_email ON public.admissions(lower(email));
CREATE INDEX IF NOT EXISTS idx_admissions_aadhaar ON public.admissions(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_admissions_application_no ON public.admissions(application_no);
