
-- 1. Create project_deliverables table
CREATE TABLE public.project_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending_review',
  notes text DEFAULT '',
  reviewed_at timestamptz,
  revision_note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;

-- RLS: Admin full access
CREATE POLICY "Admin manage all deliverables"
ON public.project_deliverables FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS: Project parties can view deliverables
CREATE POLICY "Project parties view deliverables"
ON public.project_deliverables FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_deliverables.project_id
    AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
  )
);

-- RLS: Provider can insert deliverables for own projects
CREATE POLICY "Provider insert deliverables"
ON public.project_deliverables FOR INSERT TO authenticated
WITH CHECK (
  provider_id = auth.uid()
  AND is_not_suspended(auth.uid())
  AND EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_deliverables.project_id
    AND p.assigned_provider_id = auth.uid()
  )
);

-- RLS: Provider can update own deliverables (notes, re-submit)
CREATE POLICY "Provider update own deliverables"
ON public.project_deliverables FOR UPDATE TO authenticated
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

-- RLS: Association can update deliverable status (accept/reject)
CREATE POLICY "Association update deliverable status"
ON public.project_deliverables FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_deliverables.project_id
    AND p.association_id = auth.uid()
  )
);

-- 2. Notification trigger
CREATE OR REPLACE FUNCTION public.notify_on_deliverable_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _assoc_id uuid;
  _project_title text;
  _provider_name text;
BEGIN
  SELECT association_id, title INTO _assoc_id, _project_title
  FROM projects WHERE id = NEW.project_id;

  SELECT full_name INTO _provider_name FROM profiles WHERE id = NEW.provider_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (_assoc_id, 'قام ' || _provider_name || ' بتسليم ملفات مشروع "' || _project_title || '" للمراجعة', 'deliverable_submitted');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.provider_id, 'تم قبول تسليمات مشروع "' || _project_title || '"', 'deliverable_accepted');
    ELSIF NEW.status = 'revision_requested' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.provider_id, 'تم طلب تعديلات على تسليمات مشروع "' || _project_title || '": ' || COALESCE(NEW.revision_note, ''), 'deliverable_revision');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_deliverable_change
AFTER INSERT OR UPDATE ON public.project_deliverables
FOR EACH ROW EXECUTE FUNCTION public.notify_on_deliverable_change();

-- 3. Update attachments RLS to include deliverable entity type
DROP POLICY IF EXISTS "Users view related attachments" ON public.attachments;

CREATE POLICY "Users view related attachments"
ON public.attachments FOR SELECT TO authenticated
USING (
  (user_id = auth.uid())
  OR (entity_type = 'project' AND EXISTS (
    SELECT 1 FROM projects p WHERE p.id = attachments.entity_id
    AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
  ))
  OR (entity_type = 'contract' AND EXISTS (
    SELECT 1 FROM contracts c WHERE c.id = attachments.entity_id
    AND (c.association_id = auth.uid() OR c.provider_id = auth.uid())
  ))
  OR (entity_type = 'ticket' AND EXISTS (
    SELECT 1 FROM support_tickets t WHERE t.id = attachments.entity_id AND t.user_id = auth.uid()
  ))
  OR (entity_type = 'dispute' AND EXISTS (
    SELECT 1 FROM disputes d JOIN projects p ON p.id = d.project_id
    WHERE d.id = attachments.entity_id
    AND (d.raised_by = auth.uid() OR p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
  ))
  OR (entity_type = 'bid' AND EXISTS (
    SELECT 1 FROM bids b JOIN projects p ON p.id = b.project_id
    WHERE b.id = attachments.entity_id
    AND (b.provider_id = auth.uid() OR p.association_id = auth.uid())
  ))
  OR (entity_type = 'service' AND EXISTS (
    SELECT 1 FROM micro_services ms WHERE ms.id = attachments.entity_id AND ms.provider_id = auth.uid()
  ))
  OR (entity_type = 'deliverable' AND EXISTS (
    SELECT 1 FROM project_deliverables pd JOIN projects p ON p.id = pd.project_id
    WHERE pd.id = attachments.entity_id
    AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
  ))
);
