CREATE POLICY "Public browse approved services"
  ON public.micro_services
  FOR SELECT
  TO anon
  USING (approval = 'approved');