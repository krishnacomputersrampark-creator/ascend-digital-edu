DROP POLICY IF EXISTS "branding admin read" ON storage.objects;
DROP POLICY IF EXISTS "branding admin write" ON storage.objects;
DROP POLICY IF EXISTS "branding admin update" ON storage.objects;
DROP POLICY IF EXISTS "branding admin delete" ON storage.objects;

CREATE POLICY "branding admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'branding' AND public.is_user_admin(auth.uid()));
CREATE POLICY "branding admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'branding' AND public.is_user_admin(auth.uid()));
CREATE POLICY "branding admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'branding' AND public.is_user_admin(auth.uid()))
  WITH CHECK (bucket_id = 'branding' AND public.is_user_admin(auth.uid()));
CREATE POLICY "branding admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'branding' AND public.is_user_admin(auth.uid()));