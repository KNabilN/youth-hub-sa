
-- Add new columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image_url text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS qualifications jsonb DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_views integer DEFAULT 0;

-- Create profile_saves table
CREATE TABLE public.profile_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

ALTER TABLE public.profile_saves ENABLE ROW LEVEL SECURITY;

-- Users can manage their own saves
CREATE POLICY "Users manage own saves"
ON public.profile_saves FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Anyone can count saves (for public profile display)
CREATE POLICY "Public count saves"
ON public.profile_saves FOR SELECT
USING (true);

-- Admin manage all saves
CREATE POLICY "Admin manage all saves"
ON public.profile_saves FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create increment_profile_views function
CREATE OR REPLACE FUNCTION public.increment_profile_views(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = p_id;
$$;

-- Create cover-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('cover-images', 'cover-images', true);

-- Storage policies for cover-images
CREATE POLICY "Public view cover images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cover-images');

CREATE POLICY "Users upload own cover image"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cover-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own cover image"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cover-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own cover image"
ON storage.objects FOR DELETE
USING (bucket_id = 'cover-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admin manage cover images"
ON storage.objects FOR ALL
USING (bucket_id = 'cover-images' AND has_role(auth.uid(), 'super_admin'::app_role));
