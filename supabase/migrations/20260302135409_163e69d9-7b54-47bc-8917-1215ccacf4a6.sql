
-- Create cities table
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read cities" ON public.cities FOR SELECT USING (true);

-- Admin manage
CREATE POLICY "Admin manage cities" ON public.cities FOR ALL USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Add city_id to micro_services
ALTER TABLE public.micro_services ADD COLUMN city_id uuid REFERENCES public.cities(id);

-- Add city_id to projects
ALTER TABLE public.projects ADD COLUMN city_id uuid REFERENCES public.cities(id);

-- Index for performance
CREATE INDEX idx_cities_region_id ON public.cities(region_id);
CREATE INDEX idx_micro_services_city_id ON public.micro_services(city_id);
CREATE INDEX idx_projects_city_id ON public.projects(city_id);
