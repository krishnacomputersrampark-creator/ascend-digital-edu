
-- =========================================================
-- ENUMS
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.material_visibility AS ENUM ('public', 'course', 'branch', 'batch', 'private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.material_status AS ENUM ('draft', 'published', 'unpublished', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 1. DOWNLOAD CATEGORIES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.download_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.download_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.download_categories TO authenticated;
GRANT ALL ON public.download_categories TO service_role;

ALTER TABLE public.download_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_read_all" ON public.download_categories;
CREATE POLICY "categories_read_all" ON public.download_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_admin_write" ON public.download_categories;
CREATE POLICY "categories_admin_write" ON public.download_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager'));

CREATE TRIGGER trg_download_categories_updated
  BEFORE UPDATE ON public.download_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 2. STUDY MATERIALS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.download_categories(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT DEFAULT 0,
  bucket TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  youtube_url TEXT,
  external_link TEXT,
  visibility public.material_visibility NOT NULL DEFAULT 'public',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  download_count INT NOT NULL DEFAULT 0,
  status public.material_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sm_category ON public.study_materials(category_id);
CREATE INDEX IF NOT EXISTS idx_sm_course ON public.study_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_sm_branch ON public.study_materials(branch_id);
CREATE INDEX IF NOT EXISTS idx_sm_batch ON public.study_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_sm_status ON public.study_materials(status);
CREATE INDEX IF NOT EXISTS idx_sm_uploader ON public.study_materials(uploaded_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT SELECT ON public.study_materials TO anon;
GRANT ALL ON public.study_materials TO service_role;

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Helper: is caller an admin/super_admin/branch_manager
CREATE OR REPLACE FUNCTION public.is_material_admin(_uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'super_admin') OR public.has_role(_uid,'admin') OR public.has_role(_uid,'branch_manager');
$$;

REVOKE ALL ON FUNCTION public.is_material_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_material_admin(UUID) TO authenticated, service_role;

-- Helper: does a student see this material?
CREATE OR REPLACE FUNCTION public.student_can_see_material(_uid UUID, _mid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.study_materials m
    JOIN public.students s ON s.user_id = _uid
    WHERE m.id = _mid
      AND m.status = 'published'
      AND (
        m.visibility = 'public'
        OR (m.visibility = 'course' AND m.course_id IS NOT DISTINCT FROM s.course_id)
        OR (m.visibility = 'branch' AND m.branch_id IS NOT DISTINCT FROM s.branch_id)
        OR (m.visibility = 'batch'  AND m.batch_id  IS NOT DISTINCT FROM s.batch_id)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.student_can_see_material(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.student_can_see_material(UUID, UUID) TO authenticated, service_role;

-- Publicly visible published materials (marketing site preview)
DROP POLICY IF EXISTS "sm_read_public" ON public.study_materials;
CREATE POLICY "sm_read_public" ON public.study_materials
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND visibility = 'public');

-- Students can read materials assigned to them
DROP POLICY IF EXISTS "sm_read_students" ON public.study_materials;
CREATE POLICY "sm_read_students" ON public.study_materials
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid()
        AND (
          visibility = 'course' AND course_id IS NOT DISTINCT FROM s.course_id
          OR visibility = 'branch' AND branch_id IS NOT DISTINCT FROM s.branch_id
          OR visibility = 'batch'  AND batch_id  IS NOT DISTINCT FROM s.batch_id
        )
    )
  );

-- Faculty read: any published material or own uploads
DROP POLICY IF EXISTS "sm_read_faculty" ON public.study_materials;
CREATE POLICY "sm_read_faculty" ON public.study_materials
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'faculty') AND (status = 'published' OR uploaded_by = auth.uid()));

-- Admin full read
DROP POLICY IF EXISTS "sm_read_admin" ON public.study_materials;
CREATE POLICY "sm_read_admin" ON public.study_materials
  FOR SELECT TO authenticated
  USING (public.is_material_admin(auth.uid()));

-- Faculty insert (own uploads only)
DROP POLICY IF EXISTS "sm_insert_faculty" ON public.study_materials;
CREATE POLICY "sm_insert_faculty" ON public.study_materials
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(),'faculty') OR public.is_material_admin(auth.uid()))
    AND uploaded_by = auth.uid()
  );

-- Faculty update own; admins update any
DROP POLICY IF EXISTS "sm_update_own_or_admin" ON public.study_materials;
CREATE POLICY "sm_update_own_or_admin" ON public.study_materials
  FOR UPDATE TO authenticated
  USING (public.is_material_admin(auth.uid()) OR uploaded_by = auth.uid())
  WITH CHECK (public.is_material_admin(auth.uid()) OR uploaded_by = auth.uid());

-- Delete: only admins or the faculty owner (but not on admin uploads)
DROP POLICY IF EXISTS "sm_delete_rules" ON public.study_materials;
CREATE POLICY "sm_delete_rules" ON public.study_materials
  FOR DELETE TO authenticated
  USING (
    public.is_material_admin(auth.uid())
    OR (uploaded_by = auth.uid() AND public.has_role(auth.uid(),'faculty'))
  );

CREATE TRIGGER trg_study_materials_updated
  BEFORE UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 3. DOWNLOAD HISTORY
-- =========================================================
CREATE TABLE IF NOT EXISTS public.download_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  study_material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  device TEXT
);
CREATE INDEX IF NOT EXISTS idx_dh_student ON public.download_history(student_id);
CREATE INDEX IF NOT EXISTS idx_dh_material ON public.download_history(study_material_id);
CREATE INDEX IF NOT EXISTS idx_dh_downloaded_at ON public.download_history(downloaded_at DESC);

GRANT SELECT, INSERT ON public.download_history TO authenticated;
GRANT ALL ON public.download_history TO service_role;

ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

-- User can insert their own log
DROP POLICY IF EXISTS "dh_insert_self" ON public.download_history;
CREATE POLICY "dh_insert_self" ON public.download_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User can see their own log
DROP POLICY IF EXISTS "dh_read_self" ON public.download_history;
CREATE POLICY "dh_read_self" ON public.download_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins see all
DROP POLICY IF EXISTS "dh_read_admin" ON public.download_history;
CREATE POLICY "dh_read_admin" ON public.download_history
  FOR SELECT TO authenticated
  USING (public.is_material_admin(auth.uid()));

-- Increment counter trigger
CREATE OR REPLACE FUNCTION public.increment_material_download()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.study_materials
     SET download_count = COALESCE(download_count,0) + 1
   WHERE id = NEW.study_material_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_dh_increment ON public.download_history;
CREATE TRIGGER trg_dh_increment
  AFTER INSERT ON public.download_history
  FOR EACH ROW EXECUTE FUNCTION public.increment_material_download();

-- Notify students when a new material is published for them
CREATE OR REPLACE FUNCTION public.notify_material_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _s RECORD; _link TEXT;
BEGIN
  IF NEW.status <> 'published' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'published' THEN RETURN NEW; END IF;

  _link := '/student-dashboard/downloads/' || NEW.id::text;

  FOR _s IN
    SELECT s.id
      FROM public.students s
     WHERE
       NEW.visibility = 'public'
       OR (NEW.visibility = 'course' AND s.course_id IS NOT DISTINCT FROM NEW.course_id)
       OR (NEW.visibility = 'branch' AND s.branch_id IS NOT DISTINCT FROM NEW.branch_id)
       OR (NEW.visibility = 'batch'  AND s.batch_id  IS NOT DISTINCT FROM NEW.batch_id)
  LOOP
    INSERT INTO public.notifications (title, description, type, student_id, link)
    VALUES ('New study material: ' || NEW.title,
            COALESCE(NEW.description, 'A new resource has been added to your downloads.'),
            'material_published', _s.id, _link);
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sm_notify ON public.study_materials;
CREATE TRIGGER trg_sm_notify
  AFTER INSERT OR UPDATE OF status ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.notify_material_published();

-- =========================================================
-- 4. FAVORITES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.material_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_material_id UUID NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, study_material_id)
);

GRANT SELECT, INSERT, DELETE ON public.material_favorites TO authenticated;
GRANT ALL ON public.material_favorites TO service_role;

ALTER TABLE public.material_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fav_self_all" ON public.material_favorites;
CREATE POLICY "fav_self_all" ON public.material_favorites
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================================
-- 5. SEED DEFAULT CATEGORIES
-- =========================================================
INSERT INTO public.download_categories (category_name, icon, display_order) VALUES
  ('Notes','notebook-pen',10),
  ('Assignments','clipboard-list',20),
  ('Practical Files','flask-conical',30),
  ('Question Papers','file-question',40),
  ('Sample Papers','file-text',50),
  ('Syllabus','book-open',60),
  ('E-Books','book',70),
  ('Projects','folder-git-2',80),
  ('Software','app-window',90),
  ('Video Lectures','video',100),
  ('Forms','file-badge',110),
  ('Circulars','megaphone',120)
ON CONFLICT (category_name) DO NOTHING;

-- =========================================================
-- 6. STORAGE POLICIES (7 buckets)
-- =========================================================
-- Buckets are created via the storage API; policies live on storage.objects.

DROP POLICY IF EXISTS "downloads_read_auth" ON storage.objects;
CREATE POLICY "downloads_read_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('study-materials','assignments','ebooks','question-papers','software','videos','thumbnails'));

DROP POLICY IF EXISTS "downloads_write_faculty" ON storage.objects;
CREATE POLICY "downloads_write_faculty" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('study-materials','assignments','ebooks','question-papers','software','videos','thumbnails')
    AND (public.is_material_admin(auth.uid()) OR public.has_role(auth.uid(),'faculty'))
  );

DROP POLICY IF EXISTS "downloads_update_owner_or_admin" ON storage.objects;
CREATE POLICY "downloads_update_owner_or_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('study-materials','assignments','ebooks','question-papers','software','videos','thumbnails')
    AND (public.is_material_admin(auth.uid()) OR owner = auth.uid())
  );

DROP POLICY IF EXISTS "downloads_delete_owner_or_admin" ON storage.objects;
CREATE POLICY "downloads_delete_owner_or_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('study-materials','assignments','ebooks','question-papers','software','videos','thumbnails')
    AND (public.is_material_admin(auth.uid()) OR owner = auth.uid())
  );
