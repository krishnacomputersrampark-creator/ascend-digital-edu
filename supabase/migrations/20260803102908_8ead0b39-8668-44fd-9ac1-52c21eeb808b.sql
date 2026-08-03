
-- COURSES ---------------------------------------------------------------
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS short_name text,
  ADD COLUMN IF NOT EXISTS duration_unit text NOT NULL DEFAULT 'months',
  ADD COLUMN IF NOT EXISTS hours integer,
  ADD COLUMN IF NOT EXISTS medium text,
  ADD COLUMN IF NOT EXISTS certificate_type text,
  ADD COLUMN IF NOT EXISTS exam_pattern text,
  ADD COLUMN IF NOT EXISTS study_material text,
  ADD COLUMN IF NOT EXISTS training_partner text,
  ADD COLUMN IF NOT EXISTS course_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS registration_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exam_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS syllabus_url text,
  ADD COLUMN IF NOT EXISTS prospectus_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE public.courses SET course_fee = fees WHERE course_fee = 0 AND fees > 0;
UPDATE public.courses SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END;

CREATE OR REPLACE FUNCTION public.sync_course_legacy()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.fees := COALESCE(NEW.course_fee, 0);
  NEW.is_active := (NEW.status = 'active');
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(COALESCE(NEW.name,'course'), '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_course_legacy ON public.courses;
CREATE TRIGGER trg_sync_course_legacy BEFORE INSERT OR UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.sync_course_legacy();

CREATE OR REPLACE FUNCTION public.next_course_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(code, '\D', '', 'g'), '')::int), 0) + 1
    INTO n FROM public.courses WHERE code LIKE 'KCC-C-%';
  RETURN 'KCC-C-' || lpad(n::text, 3, '0');
END; $$;

-- BATCHES ---------------------------------------------------------------
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS session text,
  ADD COLUMN IF NOT EXISTS days text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS current_strength integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS room_number text,
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS remarks text,
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS batches_code_uidx ON public.batches (lower(code)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS courses_code_uidx ON public.courses (lower(code)) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.next_batch_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; yy text := to_char(now(), 'YY');
BEGIN
  SELECT COALESCE(MAX(NULLIF(right(code, 3), '')::int), 0) + 1 INTO n
  FROM public.batches WHERE code LIKE 'BT-' || yy || '-%';
  RETURN 'BT-' || yy || '-' || lpad(n::text, 3, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.touch_batch_updated()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_touch_batch ON public.batches;
CREATE TRIGGER trg_touch_batch BEFORE UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.touch_batch_updated();

-- keep current_strength accurate
CREATE OR REPLACE FUNCTION public.recount_batch_strength()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') AND OLD.batch_id IS NOT NULL THEN
    UPDATE public.batches b SET current_strength =
      (SELECT count(*) FROM public.students s WHERE s.batch_id = b.id) WHERE b.id = OLD.batch_id;
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.batch_id IS NOT NULL THEN
    UPDATE public.batches b SET current_strength =
      (SELECT count(*) FROM public.students s WHERE s.batch_id = b.id) WHERE b.id = NEW.batch_id;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_recount_batch_strength ON public.students;
CREATE TRIGGER trg_recount_batch_strength AFTER INSERT OR UPDATE OF batch_id OR DELETE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.recount_batch_strength();

UPDATE public.batches b SET current_strength =
  (SELECT count(*) FROM public.students s WHERE s.batch_id = b.id);

GRANT SELECT ON public.courses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT SELECT ON public.batches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO authenticated;
GRANT ALL ON public.batches TO service_role;
