-- Allow anonymous users to read profiles of providers with approved services
CREATE POLICY "Public browse approved service providers"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.micro_services ms
      WHERE ms.provider_id = profiles.id AND ms.approval = 'approved'
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE (p.association_id = profiles.id) AND p.status <> 'draft' AND p.is_private = false
    )
  );