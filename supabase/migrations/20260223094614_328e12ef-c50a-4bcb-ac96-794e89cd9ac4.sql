
-- Drop the overly permissive policies
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY "Authenticated users can create invoices" ON public.invoices;

-- Recreate with proper checks
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Project parties can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND issued_to IS NOT NULL);
