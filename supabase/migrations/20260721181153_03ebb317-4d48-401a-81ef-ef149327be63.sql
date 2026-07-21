
-- Certificate number sequence
CREATE SEQUENCE IF NOT EXISTS public.certificate_no_seq START 1;

CREATE OR REPLACE FUNCTION public.next_certificate_no()
RETURNS text
LANGUAGE sql
SET search_path = public
AS $$
  SELECT 'KCC-CERT-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.certificate_no_seq')::text, 6, '0');
$$;

-- Certificate type enum
DO $$ BEGIN
  CREATE TYPE public.certificate_type AS ENUM (
    'course_completion','diploma','advanced_diploma','training','internship','excellence','participation'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.certificate_status AS ENUM ('draft','issued','revoked','expired','reissued');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.template_status AS ENUM ('active','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==========================================================
-- certificate_templates
-- ==========================================================
CREATE TABLE public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  template_file text,
  background_image text,
  signature_image text,
  seal_image text,
  status public.template_status NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view templates"
  ON public.certificate_templates FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager') OR
    public.has_role(auth.uid(),'faculty')
  );

CREATE POLICY "Staff can manage templates"
  ON public.certificate_templates FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager')
  );

CREATE TRIGGER trg_certificate_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================================
-- certificates
-- ==========================================================
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number text NOT NULL UNIQUE DEFAULT public.next_certificate_no(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  completion_date date,
  grade text,
  percentage numeric(5,2),
  certificate_type public.certificate_type NOT NULL DEFAULT 'course_completion',
  verification_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  qr_code_url text,
  pdf_url text,
  status public.certificate_status NOT NULL DEFAULT 'issued',
  issued_by uuid REFERENCES auth.users(id),
  revoked_reason text,
  reissued_from uuid REFERENCES public.certificates(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificates_student ON public.certificates(student_id);
CREATE INDEX idx_certificates_course ON public.certificates(course_id);
CREATE INDEX idx_certificates_status ON public.certificates(status);
CREATE INDEX idx_certificates_issue_date ON public.certificates(issue_date DESC);

-- Prevent duplicate active certificates (same student + course + type)
CREATE UNIQUE INDEX ux_certificates_active_unique
  ON public.certificates(student_id, course_id, certificate_type)
  WHERE status IN ('issued','reissued');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
-- Public verification: allow anon SELECT (RLS filters to only issued/revoked, hides drafts)
GRANT SELECT ON public.certificates TO anon;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Public verification: anyone can look up non-draft certs (metadata only; PII masked in UI)
CREATE POLICY "Public can verify issued certificates"
  ON public.certificates FOR SELECT
  TO anon, authenticated
  USING (status <> 'draft');

-- Students can view their own certificates
CREATE POLICY "Students can view own certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Staff full access
CREATE POLICY "Staff can view all certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager') OR
    public.has_role(auth.uid(),'faculty')
  );

CREATE POLICY "Staff can manage certificates"
  ON public.certificates FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR
    public.has_role(auth.uid(),'admin') OR
    public.has_role(auth.uid(),'branch_manager')
  );

CREATE TRIGGER trg_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================================
-- Notify students on certificate lifecycle
-- ==========================================================
CREATE OR REPLACE FUNCTION public.notify_certificate_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title text;
  _desc text;
  _type text;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('issued','reissued') THEN
    _title := 'New certificate issued';
    _desc := 'Certificate ' || NEW.certificate_number || ' has been issued.';
    _type := 'certificate_issued';
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'revoked' AND OLD.status <> 'revoked' THEN
    _title := 'Certificate revoked';
    _desc := 'Certificate ' || NEW.certificate_number || ' has been revoked.';
    _type := 'certificate_revoked';
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'reissued' AND OLD.status <> 'reissued' THEN
    _title := 'Certificate reissued';
    _desc := 'Certificate ' || NEW.certificate_number || ' has been reissued.';
    _type := 'certificate_reissued';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (title, description, type, student_id, link)
  VALUES (_title, _desc, _type, NEW.student_id,
    '/student-dashboard/certificates/view/' || NEW.id::text);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_certificates_notify_ins
  AFTER INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.notify_certificate_change();

CREATE TRIGGER trg_certificates_notify_upd
  AFTER UPDATE OF status ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.notify_certificate_change();
