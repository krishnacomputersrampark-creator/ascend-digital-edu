
CREATE TYPE public.attendance_status AS ENUM ('present','absent','late','half_day','leave','holiday');

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  attendance_date date NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'present',
  check_in_time time,
  check_out_time time,
  remarks text,
  marked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, attendance_date)
);

CREATE INDEX idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_batch_date ON public.attendance(batch_id, attendance_date);
CREATE INDEX idx_attendance_branch_date ON public.attendance(branch_id, attendance_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Students: read own attendance
CREATE POLICY "Students view own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = attendance.student_id AND s.user_id = auth.uid()
    )
  );

-- Staff: full read
CREATE POLICY "Staff view all attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager') OR
    public.has_role(auth.uid(),'faculty')
  );

-- Staff: insert
CREATE POLICY "Staff insert attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager') OR
    public.has_role(auth.uid(),'faculty')
  );

-- Staff: update
CREATE POLICY "Staff update attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager') OR
    public.has_role(auth.uid(),'faculty')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager') OR
    public.has_role(auth.uid(),'faculty')
  );

-- Staff: delete
CREATE POLICY "Staff delete attendance"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager')
  );

CREATE TRIGGER attendance_set_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
