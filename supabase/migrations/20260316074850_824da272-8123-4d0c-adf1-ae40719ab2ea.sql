
-- 1. Service inquiries table
CREATE TABLE public.service_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.micro_services(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, sender_id)
);

ALTER TABLE public.service_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inquiry parties can view" ON public.service_inquiries
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR provider_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can create inquiries" ON public.service_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND is_not_suspended(auth.uid()));

CREATE POLICY "Parties can update inquiries" ON public.service_inquiries
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR provider_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admin manage all inquiries" ON public.service_inquiries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 2. Service inquiry messages table
CREATE TABLE public.service_inquiry_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  attachment_url text,
  attachment_name text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_inquiry_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inquiry parties can view messages" ON public.service_inquiry_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.service_inquiries si
    WHERE si.id = service_inquiry_messages.inquiry_id
    AND (si.sender_id = auth.uid() OR si.provider_id = auth.uid())
  ) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Inquiry parties can send messages" ON public.service_inquiry_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_not_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.service_inquiries si
      WHERE si.id = service_inquiry_messages.inquiry_id
      AND (si.sender_id = auth.uid() OR si.provider_id = auth.uid())
    )
  );

CREATE POLICY "Inquiry parties can update read status" ON public.service_inquiry_messages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.service_inquiries si
    WHERE si.id = service_inquiry_messages.inquiry_id
    AND (si.sender_id = auth.uid() OR si.provider_id = auth.uid())
  ));

CREATE POLICY "Admin manage all inquiry messages" ON public.service_inquiry_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_inquiry_messages;

-- 4. Notification trigger for new inquiry
CREATE OR REPLACE FUNCTION public.notify_on_service_inquiry()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _service_title text;
  _sender_name text;
BEGIN
  SELECT title INTO _service_title FROM micro_services WHERE id = NEW.service_id;
  SELECT COALESCE(organization_name, full_name) INTO _sender_name FROM profiles WHERE id = NEW.sender_id;

  INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
  VALUES (NEW.provider_id, 'استفسار جديد من ' || _sender_name || ' على خدمة "' || _service_title || '"', 'inquiry_created', NEW.service_id, 'service');

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_notify_service_inquiry
  AFTER INSERT ON public.service_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_service_inquiry();

-- 5. Notification trigger for new inquiry message
CREATE OR REPLACE FUNCTION public.notify_on_inquiry_message()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _inquiry record;
  _service_title text;
  _sender_name text;
  _recipient_id uuid;
BEGIN
  SELECT * INTO _inquiry FROM service_inquiries WHERE id = NEW.inquiry_id;
  SELECT title INTO _service_title FROM micro_services WHERE id = _inquiry.service_id;
  SELECT COALESCE(organization_name, full_name) INTO _sender_name FROM profiles WHERE id = NEW.sender_id;

  IF NEW.sender_id = _inquiry.sender_id THEN
    _recipient_id := _inquiry.provider_id;
  ELSE
    _recipient_id := _inquiry.sender_id;
  END IF;

  INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
  VALUES (_recipient_id, 'رسالة جديدة من ' || _sender_name || ' في استفسار خدمة "' || _service_title || '"', 'inquiry_message', _inquiry.service_id, 'service');

  -- Update inquiry updated_at
  UPDATE service_inquiries SET updated_at = now() WHERE id = NEW.inquiry_id;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_notify_inquiry_message
  AFTER INSERT ON public.service_inquiry_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_inquiry_message();
