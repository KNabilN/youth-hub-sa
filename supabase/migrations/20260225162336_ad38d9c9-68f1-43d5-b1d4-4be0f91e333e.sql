
-- Create contract_versions table to track contract edits
CREATE TABLE public.contract_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  terms TEXT NOT NULL DEFAULT '',
  changed_by UUID REFERENCES public.profiles(id),
  change_note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;

-- Contract parties can view versions
CREATE POLICY "Contract parties view versions"
ON public.contract_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_versions.contract_id
    AND (c.association_id = auth.uid() OR c.provider_id = auth.uid())
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Contract parties can insert versions (before both sign)
CREATE POLICY "Contract parties insert versions"
ON public.contract_versions
FOR INSERT
WITH CHECK (
  auth.uid() = changed_by
  AND EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_versions.contract_id
    AND (c.association_id = auth.uid() OR c.provider_id = auth.uid())
  )
);

-- Admin manage all versions
CREATE POLICY "Admin manage all contract versions"
ON public.contract_versions
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add audit trigger
CREATE TRIGGER audit_contract_versions
AFTER INSERT OR UPDATE OR DELETE ON public.contract_versions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
