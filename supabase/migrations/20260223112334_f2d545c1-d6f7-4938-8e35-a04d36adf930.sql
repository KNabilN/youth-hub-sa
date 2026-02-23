
-- 1. Create dispute_responses table for comment thread
CREATE TABLE public.dispute_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dispute_responses ENABLE ROW LEVEL SECURITY;

-- Involved parties can view responses
CREATE POLICY "Involved parties view dispute responses"
ON public.dispute_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM disputes d
    JOIN projects p ON p.id = d.project_id
    WHERE d.id = dispute_responses.dispute_id
    AND (
      d.raised_by = auth.uid()
      OR p.association_id = auth.uid()
      OR p.assigned_provider_id = auth.uid()
    )
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Involved parties can insert responses
CREATE POLICY "Involved parties insert dispute responses"
ON public.dispute_responses
FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM disputes d
    JOIN projects p ON p.id = d.project_id
    WHERE d.id = dispute_responses.dispute_id
    AND (
      d.raised_by = auth.uid()
      OR p.association_id = auth.uid()
      OR p.assigned_provider_id = auth.uid()
    )
  )
);

-- Admin manage all
CREATE POLICY "Admin manage all dispute responses"
ON public.dispute_responses
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 2. Add pending_approval to project_status enum
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'pending_approval' BEFORE 'open';

-- 3. Audit trigger on dispute_responses
CREATE TRIGGER audit_dispute_responses
AFTER INSERT OR UPDATE OR DELETE ON public.dispute_responses
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
