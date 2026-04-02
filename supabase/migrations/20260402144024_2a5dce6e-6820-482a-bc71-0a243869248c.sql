CREATE POLICY "Admins upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images'
  AND public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images'
  AND public.has_role(auth.uid(), 'super_admin')
);