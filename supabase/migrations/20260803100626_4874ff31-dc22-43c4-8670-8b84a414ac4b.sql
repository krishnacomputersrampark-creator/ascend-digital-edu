
CREATE POLICY "Staff read teacher files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'teachers' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'faculty')));

CREATE POLICY "Staff upload teacher files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'teachers' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager')));

CREATE POLICY "Staff update teacher files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'teachers' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager')));

CREATE POLICY "Staff delete teacher files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'teachers' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin')));
