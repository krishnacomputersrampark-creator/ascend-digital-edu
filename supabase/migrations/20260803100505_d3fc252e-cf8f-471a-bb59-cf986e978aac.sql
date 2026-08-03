
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  teacher_id text NOT NULL UNIQUE,
  employee_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  father_name text,
  mother_name text,
  gender text,
  dob date,
  blood_group text,
  mobile text NOT NULL,
  alternate_mobile text,
  email text,
  address text,
  state text,
  district text,
  pin_code text,
  aadhaar_number text,
  pan_number text,
  qualification text,
  experience text,
  designation text,
  department text,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  joining_date date,
  salary numeric NOT NULL DEFAULT 0,
  subjects text,
  working_days text,
  preferred_timings text,
  photo_url text,
  aadhaar_url text,
  pan_url text,
  qualification_url text,
  experience_url text,
  signature_url text,
  status text NOT NULL DEFAULT 'active',
  remarks text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_teachers_branch ON public.teachers(branch_id);
CREATE INDEX idx_teachers_status ON public.teachers(status);
CREATE INDEX idx_teachers_deleted ON public.teachers(deleted_at);
CREATE INDEX idx_teachers_name_trgm ON public.teachers USING gin (full_name gin_trgm_ops);
CREATE UNIQUE INDEX idx_teachers_mobile_live ON public.teachers(mobile) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_teachers_email_live ON public.teachers(lower(email)) WHERE deleted_at IS NULL AND email IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage teachers" ON public.teachers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Branch managers manage own branch teachers" ON public.teachers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'branch_manager') AND branch_id = public.my_branch_id())
  WITH CHECK (public.has_role(auth.uid(),'branch_manager') AND branch_id = public.my_branch_id());

CREATE POLICY "Faculty view own teacher profile" ON public.teachers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.teacher_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, course_id)
);
CREATE INDEX idx_teacher_courses_teacher ON public.teacher_courses(teacher_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_courses TO authenticated;
GRANT ALL ON public.teacher_courses TO service_role;
ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage teacher courses" ON public.teacher_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));

CREATE POLICY "Faculty view own teacher courses" ON public.teacher_courses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_courses.teacher_id AND t.user_id = auth.uid()));

CREATE TABLE public.teacher_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, batch_id)
);
CREATE INDEX idx_teacher_batches_teacher ON public.teacher_batches(teacher_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_batches TO authenticated;
GRANT ALL ON public.teacher_batches TO service_role;
ALTER TABLE public.teacher_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage teacher batches" ON public.teacher_batches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));

CREATE POLICY "Faculty view own teacher batches" ON public.teacher_batches FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_batches.teacher_id AND t.user_id = auth.uid()));

CREATE TABLE public.teacher_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email text,
  action text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_teacher_edit_history_teacher ON public.teacher_edit_history(teacher_id);
GRANT SELECT, INSERT ON public.teacher_edit_history TO authenticated;
GRANT ALL ON public.teacher_edit_history TO service_role;
ALTER TABLE public.teacher_edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read teacher history" ON public.teacher_edit_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));
CREATE POLICY "Staff write teacher history" ON public.teacher_edit_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));

CREATE OR REPLACE FUNCTION public.next_teacher_id()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; y text := to_char(now(), 'YYYY');
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(teacher_id, '^KCCT' || y, ''), '')::int), 0) + 1
    INTO n FROM public.teachers WHERE teacher_id LIKE 'KCCT' || y || '%';
  RETURN 'KCCT' || y || lpad(n::text, 4, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.next_employee_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(employee_code, '^EMP', ''), '')::int), 0) + 1
    INTO n FROM public.teachers WHERE employee_code LIKE 'EMP%';
  RETURN 'EMP' || lpad(n::text, 5, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.teachers_autofill()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.teacher_id IS NULL OR NEW.teacher_id = '' THEN NEW.teacher_id := public.next_teacher_id(); END IF;
  IF NEW.employee_code IS NULL OR NEW.employee_code = '' THEN NEW.employee_code := public.next_employee_code(); END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_teachers_autofill BEFORE INSERT ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.teachers_autofill();
