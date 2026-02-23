
-- Batch 1: Add image_url to micro_services
ALTER TABLE public.micro_services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Batch 1: Create service-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: providers can upload to service-images
CREATE POLICY "Providers upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS: public read service images
CREATE POLICY "Public read service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- Storage RLS: providers can delete own service images
CREATE POLICY "Providers delete own service images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Batch 3: Admin can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));
