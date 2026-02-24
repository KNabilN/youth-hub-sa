
-- Update RLS policy for attachments to include dispute entity type
DROP POLICY IF EXISTS "Users view related attachments" ON public.attachments;
CREATE POLICY "Users view related attachments"
  ON public.attachments
  FOR SELECT
  USING (
    (user_id = auth.uid())
    OR ((entity_type = 'project') AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = attachments.entity_id
        AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
    ))
    OR ((entity_type = 'contract') AND EXISTS (
      SELECT 1 FROM contracts c WHERE c.id = attachments.entity_id
        AND (c.association_id = auth.uid() OR c.provider_id = auth.uid())
    ))
    OR ((entity_type = 'ticket') AND EXISTS (
      SELECT 1 FROM support_tickets t WHERE t.id = attachments.entity_id
        AND t.user_id = auth.uid()
    ))
    OR ((entity_type = 'dispute') AND EXISTS (
      SELECT 1 FROM disputes d
        JOIN projects p ON p.id = d.project_id
      WHERE d.id = attachments.entity_id
        AND (d.raised_by = auth.uid() OR p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
    ))
  );

-- Create dispute status log table for timeline tracking
CREATE TABLE public.dispute_status_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id),
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dispute_status_log ENABLE ROW LEVEL SECURITY;

-- Involved parties and admin can view status log
CREATE POLICY "View dispute status log"
  ON public.dispute_status_log
  FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM disputes d
        JOIN projects p ON p.id = d.project_id
      WHERE d.id = dispute_status_log.dispute_id
        AND (d.raised_by = auth.uid() OR p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
    )
  );

-- Admin can insert status log entries
CREATE POLICY "Admin insert status log"
  ON public.dispute_status_log
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Auto-log status changes via trigger
CREATE OR REPLACE FUNCTION public.log_dispute_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.dispute_status_log (dispute_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_dispute_status_log
  AFTER UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_dispute_status_change();
