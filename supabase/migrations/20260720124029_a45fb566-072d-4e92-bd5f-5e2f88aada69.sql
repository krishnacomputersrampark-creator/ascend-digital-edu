
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.exam_type AS ENUM (
    'monthly_test','quarterly_exam','half_yearly','annual_exam',
    'practical_exam','internal_assessment','final_examination'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.exam_status AS ENUM ('scheduled','ongoing','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.result_status AS ENUM ('draft','published','withheld','re_evaluation','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ SUBJECTS ============
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code text NOT NULL,
  subject_name text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  maximum_marks numeric(6,2) NOT NULL DEFAULT 100,
  minimum_passing_marks numeric(6,2) NOT NULL DEFAULT 40,
  theory_marks numeric(6,2) NOT NULL DEFAULT 70,
  practical_marks numeric(6,2) NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, subject_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone auth can read subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage subjects" ON public.subjects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'));

CREATE TRIGGER subjects_set_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EXAMS ============
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name text NOT NULL,
  exam_type public.exam_type NOT NULL DEFAULT 'monthly_test',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  exam_date date,
  result_publish_date date,
  status public.exam_status NOT NULL DEFAULT 'scheduled',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read exams" ON public.exams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage exams" ON public.exams
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'));

CREATE TRIGGER exams_set_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ STUDENT_RESULTS ============
CREATE TABLE IF NOT EXISTS public.student_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  total_marks numeric(8,2) NOT NULL DEFAULT 0,
  obtained_marks numeric(8,2) NOT NULL DEFAULT 0,
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  grade text,
  division text,
  result_status public.result_status NOT NULL DEFAULT 'draft',
  pass_fail text,
  remarks text,
  published_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, exam_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_results TO authenticated;
GRANT ALL ON public.student_results TO service_role;
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own published results" ON public.student_results
  FOR SELECT TO authenticated
  USING (
    result_status = 'published' AND EXISTS (
      SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "Staff read all results" ON public.student_results
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'));
CREATE POLICY "Staff manage results" ON public.student_results
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'));

CREATE TRIGGER student_results_set_updated_at BEFORE UPDATE ON public.student_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RESULT_DETAILS ============
CREATE TABLE IF NOT EXISTS public.result_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_result_id uuid NOT NULL REFERENCES public.student_results(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  theory_marks numeric(6,2) NOT NULL DEFAULT 0,
  practical_marks numeric(6,2) NOT NULL DEFAULT 0,
  internal_marks numeric(6,2) NOT NULL DEFAULT 0,
  total_marks numeric(6,2) NOT NULL DEFAULT 0,
  grade text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_result_id, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_details TO authenticated;
GRANT ALL ON public.result_details TO service_role;
ALTER TABLE public.result_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own published detail" ON public.result_details
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_results sr
      JOIN public.students s ON s.id = sr.student_id
      WHERE sr.id = student_result_id
        AND sr.result_status = 'published'
        AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "Staff read all detail" ON public.result_details
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'));
CREATE POLICY "Staff manage detail" ON public.result_details
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty'));

CREATE TRIGGER result_details_set_updated_at BEFORE UPDATE ON public.result_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ GRADE HELPER ============
CREATE OR REPLACE FUNCTION public.calc_grade(_pct numeric)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _pct >= 90 THEN 'A+'
    WHEN _pct >= 80 THEN 'A'
    WHEN _pct >= 70 THEN 'B+'
    WHEN _pct >= 60 THEN 'B'
    WHEN _pct >= 50 THEN 'C'
    WHEN _pct >= 40 THEN 'D'
    ELSE 'F'
  END;
$$;

CREATE OR REPLACE FUNCTION public.calc_division(_pct numeric)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _pct >= 60 THEN 'First Division'
    WHEN _pct >= 45 THEN 'Second Division'
    WHEN _pct >= 40 THEN 'Third Division'
    ELSE 'Fail'
  END;
$$;

-- Auto-fill grade/division/pass_fail on student_results
CREATE OR REPLACE FUNCTION public.student_results_autofill()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.total_marks > 0 THEN
    NEW.percentage := ROUND((NEW.obtained_marks / NEW.total_marks) * 100, 2);
  ELSE
    NEW.percentage := 0;
  END IF;
  NEW.grade := public.calc_grade(NEW.percentage);
  NEW.division := public.calc_division(NEW.percentage);
  NEW.pass_fail := CASE WHEN NEW.percentage >= 40 THEN 'Pass' ELSE 'Fail' END;
  RETURN NEW;
END $$;

CREATE TRIGGER student_results_autofill_trg
  BEFORE INSERT OR UPDATE ON public.student_results
  FOR EACH ROW EXECUTE FUNCTION public.student_results_autofill();

-- Auto-fill per-subject grade
CREATE OR REPLACE FUNCTION public.result_details_autofill()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE _max numeric;
BEGIN
  NEW.total_marks := COALESCE(NEW.theory_marks,0) + COALESCE(NEW.practical_marks,0) + COALESCE(NEW.internal_marks,0);
  SELECT maximum_marks INTO _max FROM public.subjects WHERE id = NEW.subject_id;
  IF _max IS NOT NULL AND _max > 0 THEN
    NEW.grade := public.calc_grade((NEW.total_marks / _max) * 100);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER result_details_autofill_trg
  BEFORE INSERT OR UPDATE ON public.result_details
  FOR EACH ROW EXECUTE FUNCTION public.result_details_autofill();

-- Notify student on publish
CREATE OR REPLACE FUNCTION public.notify_result_published()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _exam text;
BEGIN
  IF NEW.result_status = 'published' AND (OLD.result_status IS DISTINCT FROM 'published') THEN
    SELECT exam_name INTO _exam FROM public.exams WHERE id = NEW.exam_id;
    INSERT INTO public.notifications (title, description, type, student_id, link)
    VALUES (
      'Your result has been published',
      COALESCE(_exam,'Exam') || ' — Grade ' || COALESCE(NEW.grade,'-') || ' (' || COALESCE(NEW.percentage::text,'0') || '%)',
      'result_published',
      NEW.student_id,
      '/student-dashboard/results/view/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER student_results_notify_publish
  AFTER INSERT OR UPDATE ON public.student_results
  FOR EACH ROW EXECUTE FUNCTION public.notify_result_published();

CREATE INDEX IF NOT EXISTS idx_student_results_student ON public.student_results(student_id);
CREATE INDEX IF NOT EXISTS idx_student_results_exam ON public.student_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_result_details_sr ON public.result_details(student_result_id);
CREATE INDEX IF NOT EXISTS idx_subjects_course ON public.subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_course ON public.exams(course_id);
