-- Fix UPDATE policy on bank_details to include WITH CHECK for upsert support
DROP POLICY "Owner update own bank details" ON public.bank_details;

CREATE POLICY "Owner update own bank details"
ON public.bank_details
FOR UPDATE
TO authenticated
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK ((user_id = auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));