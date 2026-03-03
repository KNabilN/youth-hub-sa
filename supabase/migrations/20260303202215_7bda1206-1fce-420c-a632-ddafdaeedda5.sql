
-- Add beneficiary_id column to escrow_transactions
ALTER TABLE public.escrow_transactions 
ADD COLUMN beneficiary_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add RLS policy: beneficiary (association) can view escrow transactions where they are the beneficiary
CREATE POLICY "Beneficiary view own escrow"
ON public.escrow_transactions
FOR SELECT
TO authenticated
USING (beneficiary_id = auth.uid());

-- Add RLS policy for donors to see projects they funded
CREATE POLICY "Donors see funded projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escrow_transactions et
    WHERE et.project_id = projects.id
    AND et.payer_id = auth.uid()
    AND has_role(auth.uid(), 'donor'::app_role)
  )
);
