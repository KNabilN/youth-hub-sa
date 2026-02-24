
-- Portfolio items table
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Providers manage own portfolio
CREATE POLICY "Providers manage own portfolio"
  ON public.portfolio_items FOR ALL
  USING (provider_id = auth.uid());

-- Public can view portfolio items
CREATE POLICY "Public view portfolio"
  ON public.portfolio_items FOR SELECT
  USING (true);

-- Storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);

-- Storage policies
CREATE POLICY "Users upload own portfolio images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own portfolio images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public view portfolio images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');
