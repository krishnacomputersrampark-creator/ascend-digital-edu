-- target-post-migration.sql
-- Run this in the SQL Editor of your target Supabase project.
-- Purpose only:
--   1. Advance public numbering sequences past migrated values.
--   2. Recreate the 16 storage access policies on storage.objects.
-- Safe to run multiple times: every step is idempotent (DROP IF EXISTS + CREATE OR REPLACE / setval).
-- Does NOT drop schemas, tables, or ERP data.

BEGIN;

-- ============================================================
-- 1. Advance numbering sequences past migrated values
-- ============================================================
-- Values below match the highest numeric suffix already used in the migrated data.
-- nextval() will then return a value higher than these.

SELECT setval('public.admission_no_seq', 1009, true);
SELECT setval('public.admission_number_seq', 18, true);
SELECT setval('public.application_no_seq', 9, true);
SELECT setval('public.certificate_no_seq', 1, true);
SELECT setval('public.enrollment_no_seq', 100018, true);
SELECT setval('public.receipt_no_seq', 1, true);
SELECT setval('public.student_code_seq', 1018, true);

-- ============================================================
-- 2. Recreate storage access policies on storage.objects
-- ============================================================
-- Drop existing policies first so the script is idempotent.

DROP POLICY IF EXISTS "Public upload admission docs" ON storage.objects;
DROP POLICY IF EXISTS "Staff delete teacher files" ON storage.objects;
DROP POLICY IF EXISTS "Staff manage student documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff manage student photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff read admission docs" ON storage.objects;
DROP POLICY IF EXISTS "Staff read teacher files" ON storage.objects;
DROP POLICY IF EXISTS "Staff update teacher files" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload teacher files" ON storage.objects;
DROP POLICY IF EXISTS "Students delete own photo" ON storage.objects;
DROP POLICY IF EXISTS "Students update own photo" ON storage.objects;
DROP POLICY IF EXISTS "Students upload own photo" ON storage.objects;
DROP POLICY IF EXISTS "Students view own photo" ON storage.objects;
DROP POLICY IF EXISTS "downloads_delete_owner_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "downloads_read_auth" ON storage.objects;
DROP POLICY IF EXISTS "downloads_update_owner_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "downloads_write_faculty" ON storage.objects;

CREATE POLICY "Public upload admission docs"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (bucket_id = 'documents'::text)
  AND ((storage.foldername(name))[1] = 'admissions'::text)
);

CREATE POLICY "Staff delete teacher files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (bucket_id = 'teachers'::text)
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Staff manage student documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  (bucket_id = 'documents'::text)
  AND ((storage.foldername(name))[1] = 'students'::text)
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'branch_manager'::app_role))
)
WITH CHECK (
  (bucket_id = 'documents'::text)
  AND ((storage.foldername(name))[1] = 'students'::text)
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'branch_manager'::app_role))
);

CREATE POLICY "Staff manage student photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  (bucket_id = 'student-photos'::text)
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'branch_manager'::app_role))
)
WITH CHECK (
  (bucket_id = 'student-photos'::text)
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'branch_manager'::app_role))
);

CREATE POLICY "Staff read admission docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  (bucket_id = 'documents'::text)
  AND ((storage.foldername(name))[1] = 'admissions'::text)
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'branch_manager'::app_role))
);

CREATE POLICY "Staff read teacher files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  (bucket_id = 'teachers'::text)
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'branch_manager'::app_role) OR has_role(auth.uid(), 'faculty'::app_role))
);

CREATE POLICY "Staff update teacher files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  (bucket_id = 'teachers'::text)
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'branch_manager'::app_role))
);

CREATE POLICY "Staff upload teacher files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  (bucket_id = 'teachers'::text)
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'branch_manager'::app_role))
);

CREATE POLICY "Students delete own photo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (bucket_id = 'student-photos'::text)
  AND ((storage.foldername(name))[1] = (auth.uid())::text)
);

CREATE POLICY "Students update own photo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  (bucket_id = 'student-photos'::text)
  AND ((storage.foldername(name))[1] = (auth.uid())::text)
);

CREATE POLICY "Students upload own photo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  (bucket_id = 'student-photos'::text)
  AND ((storage.foldername(name))[1] = (auth.uid())::text)
);

CREATE POLICY "Students view own photo"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  (bucket_id = 'student-photos'::text)
  AND (
    ((storage.foldername(name))[1] = (auth.uid())::text)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'branch_manager'::app_role)
    OR has_role(auth.uid(), 'faculty'::app_role)
  )
);

CREATE POLICY "downloads_delete_owner_or_admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (bucket_id = ANY (ARRAY['study-materials'::text, 'assignments'::text, 'ebooks'::text, 'question-papers'::text, 'software'::text, 'videos'::text, 'thumbnails'::text]))
  AND (is_material_admin(auth.uid()) OR (owner = auth.uid()))
);

CREATE POLICY "downloads_read_auth"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = ANY (ARRAY['study-materials'::text, 'assignments'::text, 'ebooks'::text, 'question-papers'::text, 'software'::text, 'videos'::text, 'thumbnails'::text])
);

CREATE POLICY "downloads_update_owner_or_admin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  (bucket_id = ANY (ARRAY['study-materials'::text, 'assignments'::text, 'ebooks'::text, 'question-papers'::text, 'software'::text, 'videos'::text, 'thumbnails'::text]))
  AND (is_material_admin(auth.uid()) OR (owner = auth.uid()))
);

CREATE POLICY "downloads_write_faculty"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  (bucket_id = ANY (ARRAY['study-materials'::text, 'assignments'::text, 'ebooks'::text, 'question-papers'::text, 'software'::text, 'videos'::text, 'thumbnails'::text]))
  AND (is_material_admin(auth.uid()) OR has_role(auth.uid(), 'faculty'::app_role))
);

COMMIT;

-- ============================================================
-- Verification queries (run separately after the transaction)
-- ============================================================

/*
-- 1. Sequence values should be:
--    admission_no_seq = 1009
--    admission_number_seq = 18
--    application_no_seq = 9
--    certificate_no_seq = 1
--    enrollment_no_seq = 100018
--    receipt_no_seq = 1
--    student_code_seq = 1018
SELECT sequencename, last_value, start_value
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;
*/

/*
-- 2. Exactly 16 storage policies should exist on storage.objects
SELECT COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- List them
SELECT policyname, cmd, roles::text AS roles
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
*/
