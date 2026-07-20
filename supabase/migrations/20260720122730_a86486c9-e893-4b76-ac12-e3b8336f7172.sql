
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.fee_payment_status AS ENUM ('pending','partially_paid','paid','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.fee_payment_mode AS ENUM ('cash','upi','bank_transfer','card','cheque','online');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ SEQUENCE ============
CREATE SEQUENCE IF NOT EXISTS public.receipt_no_seq START 1;

CREATE OR REPLACE FUNCTION public.next_receipt_no()
RETURNS text LANGUAGE sql SET search_path = public AS $$
  SELECT 'RCPT' || to_char(now(),'YYYY') || lpad(nextval('public.receipt_no_seq')::text, 5, '0');
$$;

-- ============ FEE STRUCTURE ============
CREATE TABLE IF NOT EXISTS public.fee_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  admission_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  registration_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  exam_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  certificate_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  study_material_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_allowed NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fee_structure_course ON public.fee_structure(course_id);
CREATE INDEX IF NOT EXISTS idx_fee_structure_branch ON public.fee_structure(branch_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_structure TO authenticated;
GRANT ALL ON public.fee_structure TO service_role;

ALTER TABLE public.fee_structure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view fee structure" ON public.fee_structure
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty')
  );
CREATE POLICY "Admins manage fee structure" ON public.fee_structure
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
  ) WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
  );

-- ============ STUDENT FEES ============
CREATE TABLE IF NOT EXISTS public.student_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES public.fee_structure(id) ON DELETE SET NULL,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  final_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status public.fee_payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);
CREATE INDEX IF NOT EXISTS idx_student_fees_student ON public.student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON public.student_fees(payment_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_fees TO authenticated;
GRANT ALL ON public.student_fees TO service_role;

ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own fees" ON public.student_fees
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_fees.student_id AND s.user_id = auth.uid())
  );
CREATE POLICY "Staff view all fees" ON public.student_fees
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty')
  );
CREATE POLICY "Staff manage fees" ON public.student_fees
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'branch_manager')
  ) WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'branch_manager')
  );

-- ============ FEE INSTALLMENTS ============
CREATE TABLE IF NOT EXISTS public.fee_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL DEFAULT 1,
  due_date DATE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  fine_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_date TIMESTAMPTZ,
  payment_mode public.fee_payment_mode,
  transaction_reference TEXT,
  receipt_number TEXT UNIQUE,
  remarks TEXT,
  status public.fee_payment_status NOT NULL DEFAULT 'pending',
  collected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fee_inst_fee ON public.fee_installments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_fee_inst_receipt ON public.fee_installments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_fee_inst_status ON public.fee_installments(status);
CREATE INDEX IF NOT EXISTS idx_fee_inst_paydate ON public.fee_installments(payment_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_installments TO authenticated;
GRANT ALL ON public.fee_installments TO service_role;

ALTER TABLE public.fee_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own installments" ON public.fee_installments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.student_fees sf
      JOIN public.students s ON s.id = sf.student_id
      WHERE sf.id = fee_installments.student_fee_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "Staff view all installments" ON public.fee_installments
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty')
  );
CREATE POLICY "Staff manage installments" ON public.fee_installments
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'branch_manager')
  ) WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'branch_manager')
  );

-- ============ TRIGGERS ============
CREATE TRIGGER trg_fee_structure_updated BEFORE UPDATE ON public.fee_structure
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_student_fees_updated BEFORE UPDATE ON public.student_fees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_fee_installments_updated BEFORE UPDATE ON public.fee_installments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-fill receipt number on paid installments
CREATE OR REPLACE FUNCTION public.fee_installment_before_ins()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.paid_amount > 0 AND NEW.receipt_number IS NULL THEN
    NEW.receipt_number := public.next_receipt_no();
  END IF;
  IF NEW.paid_amount > 0 AND NEW.payment_date IS NULL THEN
    NEW.payment_date := now();
  END IF;
  IF NEW.paid_amount >= NEW.amount + COALESCE(NEW.fine_amount,0) - COALESCE(NEW.discount_amount,0)
     AND NEW.paid_amount > 0 THEN
    NEW.status := 'paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status := 'partially_paid';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_fee_installment_before_ins
  BEFORE INSERT OR UPDATE ON public.fee_installments
  FOR EACH ROW EXECUTE FUNCTION public.fee_installment_before_ins();

-- Recalculate parent student_fees totals after installment change
CREATE OR REPLACE FUNCTION public.recalc_student_fee(_sf UUID)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _paid NUMERIC(12,2);
  _final NUMERIC(12,2);
  _status public.fee_payment_status;
BEGIN
  SELECT COALESCE(SUM(paid_amount),0) INTO _paid
  FROM public.fee_installments WHERE student_fee_id = _sf;

  SELECT final_fee INTO _final FROM public.student_fees WHERE id = _sf;

  IF _paid <= 0 THEN _status := 'pending';
  ELSIF _paid >= _final THEN _status := 'paid';
  ELSE _status := 'partially_paid';
  END IF;

  UPDATE public.student_fees
    SET paid_amount = _paid,
        due_amount = GREATEST(_final - _paid, 0),
        payment_status = _status,
        updated_at = now()
    WHERE id = _sf;
END $$;

CREATE OR REPLACE FUNCTION public.fee_installment_after_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_student_fee(OLD.student_fee_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_student_fee(NEW.student_fee_id);
    RETURN NEW;
  END IF;
END $$;

CREATE TRIGGER trg_fee_installment_after_change
  AFTER INSERT OR UPDATE OR DELETE ON public.fee_installments
  FOR EACH ROW EXECUTE FUNCTION public.fee_installment_after_change();
