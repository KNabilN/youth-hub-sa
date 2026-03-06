CREATE POLICY "Associations insert consumed contributions"
ON public.donor_contributions
FOR INSERT
TO authenticated
WITH CHECK (
  association_id = auth.uid()
  AND donation_status = 'consumed'
);