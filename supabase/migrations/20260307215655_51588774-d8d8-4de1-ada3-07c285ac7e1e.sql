
-- Add image_url column to categories
ALTER TABLE public.categories ADD COLUMN image_url text DEFAULT NULL;

-- Create category-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true);

-- Allow public read access to category-images
CREATE POLICY "Public read category images" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');

-- Allow admins to manage category images
CREATE POLICY "Admin manage category images" ON storage.objects FOR ALL USING (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'super_admin'));
