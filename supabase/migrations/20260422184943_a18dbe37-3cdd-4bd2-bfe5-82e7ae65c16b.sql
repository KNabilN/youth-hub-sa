-- 1) Table
CREATE TABLE public.admin_direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  attachment_url text,
  attachment_name text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_direct_messages_user ON public.admin_direct_messages(user_id, created_at DESC);
CREATE INDEX idx_admin_direct_messages_unread ON public.admin_direct_messages(user_id, is_read) WHERE is_read = false;

-- 2) RLS
ALTER TABLE public.admin_direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own admin conversation or admin all"
ON public.admin_direct_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

-- Admin can insert to any user's conversation
CREATE POLICY "Admins send admin messages"
ON public.admin_direct_messages FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND sender_id = auth.uid()
);

-- User can reply only inside their own conversation thread
CREATE POLICY "User replies in own thread"
ON public.admin_direct_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND user_id = auth.uid()
  AND is_not_suspended(auth.uid())
);

CREATE POLICY "Update read status own or admin"
ON public.admin_direct_messages FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admin delete admin messages"
ON public.admin_direct_messages FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 3) Realtime
ALTER TABLE public.admin_direct_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_direct_messages;

-- 4) Notification trigger
CREATE OR REPLACE FUNCTION public.notify_admin_direct_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_sender_admin boolean;
  admin_id uuid;
BEGIN
  is_sender_admin := has_role(NEW.sender_id, 'super_admin'::app_role);

  IF is_sender_admin THEN
    -- Notify the recipient user
    PERFORM send_notification_secure(
      NEW.user_id,
      'admin_message',
      'لديك رسالة جديدة من الإدارة',
      'admin_message',
      NEW.id
    );
  ELSE
    -- Notify all admins
    FOR admin_id IN
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'super_admin'::app_role
    LOOP
      PERFORM send_notification_secure(
        admin_id,
        'admin_message_reply',
        'رد جديد من المستخدم على محادثة إدارية',
        'admin_message',
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_direct_message
AFTER INSERT ON public.admin_direct_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_direct_message();