ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS session text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS remarks text,
  ADD COLUMN IF NOT EXISTS payment_mode text,
  ADD COLUMN IF NOT EXISTS receipt_number text,
  ADD COLUMN IF NOT EXISTS installments integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_students_admission_number ON public.students (admission_number);
CREATE INDEX IF NOT EXISTS idx_students_student_code ON public.students (student_code);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students (phone);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (lower(email));
CREATE INDEX IF NOT EXISTS idx_students_branch ON public.students (branch_id);
CREATE INDEX IF NOT EXISTS idx_students_course ON public.students (course_id);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students (batch_id);
CREATE INDEX IF NOT EXISTS idx_students_joined_at ON public.students (joined_at);
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON public.students (deleted_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_students_admission_number_live
  ON public.students (admission_number) WHERE deleted_at IS NULL AND admission_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_student_code_live
  ON public.students (student_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_email_live
  ON public.students (lower(email)) WHERE deleted_at IS NULL AND email IS NOT NULL;