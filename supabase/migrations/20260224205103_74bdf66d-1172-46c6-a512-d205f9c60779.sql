
-- Create attachments storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create attachments metadata table
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('project', 'contract', 'ticket'))
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin manage all attachments"
ON public.attachments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- SELECT: user sees attachments for entities they're involved in
CREATE POLICY "Users view related attachments"
ON public.attachments FOR SELECT TO authenticated
USING (
  -- Own attachments
  user_id = auth.uid()
  -- Project attachments (association or assigned provider)
  OR (entity_type = 'project' AND EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = attachments.entity_id
    AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
  ))
  -- Contract attachments (association or provider)
  OR (entity_type = 'contract' AND EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = attachments.entity_id
    AND (c.association_id = auth.uid() OR c.provider_id = auth.uid())
  ))
  -- Ticket attachments (own tickets)
  OR (entity_type = 'ticket' AND EXISTS (
    SELECT 1 FROM support_tickets t
    WHERE t.id = attachments.entity_id
    AND t.user_id = auth.uid()
  ))
);

-- INSERT: user_id must be auth.uid()
CREATE POLICY "Users insert own attachments"
ON public.attachments FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_not_suspended(auth.uid())
);

-- DELETE: owner only
CREATE POLICY "Users delete own attachments"
ON public.attachments FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_attachments_entity ON public.attachments (entity_type, entity_id);
CREATE INDEX idx_attachments_user ON public.attachments (user_id);
