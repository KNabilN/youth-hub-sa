
-- Allow authenticated users to insert notifications (for other users)
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Allow payer (association) to insert escrow transactions
CREATE POLICY "Payer can create escrow"
ON public.escrow_transactions FOR INSERT
WITH CHECK (payer_id = auth.uid());

-- Allow association to insert invoices for their projects
CREATE POLICY "Authenticated users can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (true);

-- Allow payer to update escrow status (for release/refund)
CREATE POLICY "Payer can update own escrow"
ON public.escrow_transactions FOR UPDATE
USING (payer_id = auth.uid());
