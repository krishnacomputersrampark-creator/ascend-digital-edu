REVOKE EXECUTE ON FUNCTION public.my_branch_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_branch_id() TO authenticated;

-- Staff manage student photos (any folder)
DROP POLICY IF EXISTS "Staff manage student photos" ON storage.objects;
CREATE POLICY "Staff manage student photos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'student-photos' AND (
      public.has_role(auth.uid(), 'super_admin') OR
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'branch_manager')
    )
  )
  WITH CHECK (
    bucket_id = 'student-photos' AND (
      public.has_role(auth.uid(), 'super_admin') OR
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'branch_manager')
    )
  );

-- Staff manage student documents under documents/students/*
DROP POLICY IF EXISTS "Staff manage student documents" ON storage.objects;
CREATE POLICY "Staff manage student documents" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = 'students' AND (
      public.has_role(auth.uid(), 'super_admin') OR
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'branch_manager')
    )
  )
  WITH CHECK (
    bucket_id = 'documents' AND (storage.foldername(name))[1] = 'students' AND (
      public.has_role(auth.uid(), 'super_admin') OR
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'branch_manager')
    )
  );