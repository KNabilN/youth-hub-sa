
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admin manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Project parties can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "User views own invoices" ON public.invoices;

CREATE POLICY "Admin manage all invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Project parties can create invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL) AND (issued_to IS NOT NULL));

CREATE POLICY "User views own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (issued_to = auth.uid());
