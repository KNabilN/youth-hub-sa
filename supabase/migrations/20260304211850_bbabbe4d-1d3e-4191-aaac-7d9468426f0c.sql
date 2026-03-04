ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) DEFAULT NULL;