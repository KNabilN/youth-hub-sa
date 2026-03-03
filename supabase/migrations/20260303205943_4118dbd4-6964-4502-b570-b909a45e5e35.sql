
CREATE OR REPLACE FUNCTION public.create_ticket_from_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  ticket_num text;
BEGIN
  -- Get admin user to assign the ticket to
  SELECT ur.user_id INTO admin_id
  FROM user_roles ur
  WHERE ur.role = 'super_admin'
  LIMIT 1;

  IF admin_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Generate ticket number
  ticket_num := 'CT-' || to_char(now(), 'YYMMDD') || '-' || substr(NEW.id::text, 1, 4);

  -- Create support ticket
  INSERT INTO support_tickets (user_id, subject, description, ticket_number, priority, status)
  VALUES (
    admin_id,
    'رسالة تواصل: ' || left(NEW.name, 50),
    'الاسم: ' || NEW.name || E'\n' ||
    'البريد الإلكتروني: ' || NEW.email || E'\n' ||
    '---' || E'\n' ||
    NEW.message,
    ticket_num,
    'medium',
    'open'
  );

  -- Notify admin
  INSERT INTO notifications (user_id, message, type)
  VALUES (admin_id, 'رسالة تواصل جديدة من ' || NEW.name, 'contact_message');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contact_message_create_ticket
  AFTER INSERT ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_ticket_from_contact();
