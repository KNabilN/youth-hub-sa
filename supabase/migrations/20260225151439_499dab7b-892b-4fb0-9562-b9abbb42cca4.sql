
-- ============================================================
-- Direct Messages table
-- ============================================================
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL DEFAULT '',
  attachment_url text,
  attachment_name text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only project parties (association + assigned provider) can view messages
CREATE POLICY "Project parties view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = messages.project_id
    AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only project parties can send messages
CREATE POLICY "Project parties send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND is_not_suspended(auth.uid())
  AND EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = messages.project_id
    AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
  )
);

-- Users can update own messages (mark as read)
CREATE POLICY "Users update own read status"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = messages.project_id
    AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())
  )
);

-- Admin manage all
CREATE POLICY "Admin manage all messages"
ON public.messages FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Index for fast lookups
CREATE INDEX idx_messages_project_id ON public.messages(project_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);

-- Notification trigger for new messages
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _assoc_id uuid;
  _provider_id uuid;
  _project_title text;
  _sender_name text;
  _recipient_id uuid;
BEGIN
  SELECT association_id, assigned_provider_id, title
  INTO _assoc_id, _provider_id, _project_title
  FROM projects WHERE id = NEW.project_id;

  SELECT full_name INTO _sender_name FROM profiles WHERE id = NEW.sender_id;

  -- Determine recipient (the other party)
  IF NEW.sender_id = _assoc_id THEN
    _recipient_id := _provider_id;
  ELSE
    _recipient_id := _assoc_id;
  END IF;

  IF _recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (_recipient_id, 'رسالة جديدة من ' || _sender_name || ' في مشروع "' || _project_title || '"', 'message_received');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();
