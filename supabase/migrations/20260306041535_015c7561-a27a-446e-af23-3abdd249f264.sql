
-- Allow associations to see contributions directed to them
CREATE POLICY "Associations see own contributions"
ON public.donor_contributions
FOR SELECT
TO authenticated
USING (association_id = auth.uid());

-- Allow associations to update donation_status of contributions directed to them
CREATE POLICY "Associations update own contributions status"
ON public.donor_contributions
FOR UPDATE
TO authenticated
USING (association_id = auth.uid())
WITH CHECK (association_id = auth.uid());
