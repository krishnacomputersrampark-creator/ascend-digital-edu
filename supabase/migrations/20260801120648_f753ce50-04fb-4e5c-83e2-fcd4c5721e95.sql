-- 1. Admission number sequence + generator
CREATE SEQUENCE IF NOT EXISTS public.admission_number_seq START 1;

CREATE OR REPLACE FUNCTION public.next_admission_number()
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT 'KCC/ADM/' || to_char(now(),'YYYY') || '/' || lpad(nextval('public.admission_number_seq')::text, 6, '0');
$$;

-- 2. New student columns
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS admission_number text,
  ADD COLUMN IF NOT EXISTS faculty_id uuid,
  ADD COLUMN IF NOT EXISTS course_fee numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admission_fee numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS registration_fee numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

UPDATE public.students SET admission_number = public.next_admission_number() WHERE admission_number IS NULL;

ALTER TABLE public.students ALTER COLUMN admission_number SET DEFAULT public.next_admission_number();

DO $$ BEGIN
  ALTER TABLE public.students ADD CONSTRAINT students_admission_number_key UNIQUE (admission_number);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.students
    ADD CONSTRAINT students_faculty_id_fkey FOREIGN KEY (faculty_id)
    REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_students_branch ON public.students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_course ON public.students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_joined_at ON public.students(joined_at);
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON public.students(deleted_at);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON public.students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_full_name ON public.students(lower(full_name));

-- 4. Edit history
CREATE TABLE IF NOT EXISTS public.student_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  changed_by uuid,
  changed_by_email text,
  action text NOT NULL DEFAULT 'update',
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.student_edit_history TO authenticated;
GRANT ALL ON public.student_edit_history TO service_role;

ALTER TABLE public.student_edit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view student history" ON public.student_edit_history;
CREATE POLICY "Staff view student history" ON public.student_edit_history
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'branch_manager')
  );

DROP POLICY IF EXISTS "Staff insert student history" ON public.student_edit_history;
CREATE POLICY "Staff insert student history" ON public.student_edit_history
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'branch_manager')
  );

CREATE INDEX IF NOT EXISTS idx_student_edit_history_student ON public.student_edit_history(student_id, created_at DESC);

-- 5. Branch scoping helper
CREATE OR REPLACE FUNCTION public.my_branch_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT branch_id FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_branch_id() TO authenticated;

-- 6. Refined students policies (branch managers limited to their own branch)
DROP POLICY IF EXISTS "Staff view students" ON public.students;
CREATE POLICY "Staff view students" ON public.students
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'faculty') OR
    (public.has_role(auth.uid(), 'branch_manager') AND (public.my_branch_id() IS NULL OR branch_id = public.my_branch_id())) OR
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins insert students" ON public.students;
CREATE POLICY "Admins insert students" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'branch_manager') AND (public.my_branch_id() IS NULL OR branch_id = public.my_branch_id()))
  );

DROP POLICY IF EXISTS "Admins update students" ON public.students;
CREATE POLICY "Admins update students" ON public.students
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'branch_manager') AND (public.my_branch_id() IS NULL OR branch_id = public.my_branch_id()))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'branch_manager') AND (public.my_branch_id() IS NULL OR branch_id = public.my_branch_id()))
  );