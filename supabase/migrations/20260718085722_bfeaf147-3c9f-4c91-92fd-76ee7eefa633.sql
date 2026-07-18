
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text,
  duration text,
  duration_months int,
  fees numeric(10,2) NOT NULL DEFAULT 0,
  eligibility text,
  description text,
  syllabus jsonb DEFAULT '[]'::jsonb,
  certificate boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BATCHES
CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  faculty_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  timing text,
  capacity int NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_batches_course ON public.batches(course_id);
CREATE INDEX idx_batches_branch ON public.batches(branch_id);
GRANT SELECT ON public.batches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO authenticated;
GRANT ALL ON public.batches TO service_role;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Batches viewable by everyone" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Admins manage batches" ON public.batches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sequences and number generators
CREATE SEQUENCE IF NOT EXISTS public.admission_no_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS public.student_code_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS public.enrollment_no_seq START 100001;

CREATE OR REPLACE FUNCTION public.next_admission_no()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'KCC/ADM/' || to_char(now(),'YY') || '/' || lpad(nextval('public.admission_no_seq')::text,5,'0');
$$;
CREATE OR REPLACE FUNCTION public.next_student_code()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'KCC' || to_char(now(),'YY') || lpad(nextval('public.student_code_seq')::text,5,'0');
$$;
CREATE OR REPLACE FUNCTION public.next_enrollment_no()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'ENR' || to_char(now(),'YYYY') || lpad(nextval('public.enrollment_no_seq')::text,6,'0');
$$;

-- ADMISSIONS
CREATE TABLE public.admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no text NOT NULL UNIQUE DEFAULT public.next_admission_no(),
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  date_of_birth date,
  gender text,
  address text,
  city text,
  state text,
  pincode text,
  guardian_name text,
  guardian_phone text,
  qualification text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  course_preference text,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  source text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  student_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admissions_status ON public.admissions(status);
CREATE INDEX idx_admissions_branch ON public.admissions(branch_id);
CREATE INDEX idx_admissions_phone ON public.admissions(phone);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admissions TO authenticated;
GRANT INSERT ON public.admissions TO anon;
GRANT ALL ON public.admissions TO service_role;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit admission" ON public.admissions FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');
CREATE POLICY "Staff view admissions" ON public.admissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));
CREATE POLICY "Staff update admissions" ON public.admissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));
CREATE POLICY "Admins delete admissions" ON public.admissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_admissions_updated_at BEFORE UPDATE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- STUDENTS
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admission_id uuid REFERENCES public.admissions(id) ON DELETE SET NULL,
  student_code text NOT NULL UNIQUE DEFAULT public.next_student_code(),
  enrollment_no text NOT NULL UNIQUE DEFAULT public.next_enrollment_no(),
  roll_no text,
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  date_of_birth date,
  gender text,
  address text,
  city text,
  state text,
  pincode text,
  guardian_name text,
  guardian_phone text,
  emergency_contact text,
  qualification text,
  photo_url text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  joined_at date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended','passed_out','dropped')),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_branch ON public.students(branch_id);
CREATE INDEX idx_students_course ON public.students(course_id);
CREATE INDEX idx_students_batch ON public.students(batch_id);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_students_phone ON public.students(phone);
CREATE INDEX idx_students_name_trgm ON public.students USING gin (lower(full_name) gin_trgm_ops);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view students" ON public.students FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'branch_manager')
    OR public.has_role(auth.uid(),'faculty')
    OR user_id = auth.uid()
  );
CREATE POLICY "Admins insert students" ON public.students FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));
CREATE POLICY "Admins update students" ON public.students FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));
CREATE POLICY "Admins delete students" ON public.students FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.admissions
  ADD CONSTRAINT admissions_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;

-- STUDENT DOCUMENTS
CREATE TABLE public.student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text,
  file_path text NOT NULL,
  file_size int,
  mime_type text,
  verified boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_documents TO authenticated;
GRANT ALL ON public.student_documents TO service_role;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view student docs" ON public.student_documents FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty')
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid())
  );
CREATE POLICY "Admins manage student docs" ON public.student_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));
CREATE TRIGGER trg_student_docs_updated_at BEFORE UPDATE ON public.student_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated insert audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Seed courses
INSERT INTO public.courses (code,name,slug,category,duration,duration_months,fees,eligibility,description,sort_order) VALUES
  ('DCA','Diploma in Computer Applications','dca','Diploma','12 Months',12,12000,'10th Pass','Comprehensive computer applications diploma covering MS Office, Tally, Internet, Typing.',1),
  ('ADCA','Advanced Diploma in Computer Applications','adca','Diploma','18 Months',18,18000,'12th Pass','Advanced diploma with programming and accounting modules.',2),
  ('CCC','Course on Computer Concepts','ccc','Certificate','3 Months',3,3500,'8th Pass','NIELIT-aligned certificate on computer basics.',3),
  ('TALLY','Tally Prime with GST','tally-prime','Accounting','3 Months',3,5500,'10th Pass','Complete Tally Prime training including GST.',4),
  ('OA','Office Automation','office-automation','Certificate','2 Months',2,2500,'8th Pass','MS Word, Excel, PowerPoint and Internet.',5),
  ('WEBDEV','Web Development (HTML/CSS/JS)','web-development','Programming','6 Months',6,15000,'10th Pass','Front-end web development with modern tools.',6),
  ('PY','Python Programming','python','Programming','4 Months',4,8000,'10th Pass','Python fundamentals to advanced projects.',7),
  ('GD','Graphic Designing','graphic-designing','Design','6 Months',6,12000,'10th Pass','Photoshop, Illustrator, CorelDRAW.',8),
  ('DTP','Desktop Publishing','dtp','Design','3 Months',3,4500,'8th Pass','PageMaker, CorelDRAW, Photoshop.',9),
  ('TYP','English & Hindi Typing','typing','Typing','2 Months',2,1500,'8th Pass','Speed typing certification.',10),
  ('CPO','Computer Programmer Officer','cpo','Certificate','6 Months',6,8500,'12th Pass','Office computing + programming basics.',11),
  ('AI','AI & Digital Skills','ai-digital-skills','Modern','3 Months',3,6000,'12th Pass','AI tools, prompt engineering, digital productivity.',12)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.branches (code,name,city,state,phone) VALUES
  ('KWN','Karawal Nagar Branch','Karawal Nagar','Delhi','+91-9999999999'),
  ('RMP','Rampark Branch','Rampark','Delhi','+91-9999999998')
ON CONFLICT (code) DO NOTHING;
