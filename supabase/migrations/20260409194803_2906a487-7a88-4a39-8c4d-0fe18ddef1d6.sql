
-- 1. Create notification function for ticket replies
CREATE OR REPLACE FUNCTION public.notify_on_ticket_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ticket record;
  _author_name text;
  _admin record;
  _is_admin boolean;
BEGIN
  -- Get the ticket info
  SELECT * INTO _ticket FROM support_tickets WHERE id = NEW.ticket_id;
  IF _ticket IS NULL THEN RETURN NEW; END IF;

  -- Get author name
  SELECT COALESCE(organization_name, full_name) INTO _author_name FROM profiles WHERE id = NEW.author_id;

  -- Check if the author is an admin
  _is_admin := has_role(NEW.author_id, 'super_admin');

  IF _is_admin THEN
    -- Admin replied → notify ticket owner
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (_ticket.user_id, 'رد جديد من الإدارة على تذكرتك "' || _ticket.subject || '"', 'ticket_reply', _ticket.id, 'ticket');
  ELSE
    -- User replied → notify all admins
    FOR _admin IN SELECT user_id FROM user_roles WHERE role = 'super_admin'
    LOOP
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (_admin.user_id, 'رد جديد من ' || _author_name || ' على تذكرة "' || _ticket.subject || '"', 'ticket_reply', _ticket.id, 'ticket');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create trigger on ticket_replies
DROP TRIGGER IF EXISTS trg_notify_on_ticket_reply ON public.ticket_replies;
CREATE TRIGGER trg_notify_on_ticket_reply
AFTER INSERT ON public.ticket_replies
FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_reply();

-- 3. Remove redundant triggers on support_tickets (keep only one)
DROP TRIGGER IF EXISTS trg_update_support_ticket_updated_at ON public.support_tickets;
DROP TRIGGER IF EXISTS trg_update_ticket_updated_at ON public.support_tickets;
