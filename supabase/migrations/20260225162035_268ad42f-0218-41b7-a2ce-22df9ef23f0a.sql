
-- Add delivery_status to notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'delivered';

-- Add trigger for service approval notification
CREATE OR REPLACE FUNCTION public.notify_on_service_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _provider_name text;
BEGIN
  IF OLD.approval IS DISTINCT FROM NEW.approval THEN
    IF NEW.approval = 'approved' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.provider_id, 'تمت الموافقة على خدمتك "' || NEW.title || '" وهي الآن منشورة في السوق', 'service_approved');
    ELSIF NEW.approval = 'rejected' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.provider_id, 'تم رفض خدمتك "' || NEW.title || '"', 'service_rejected');
    ELSIF NEW.approval = 'suspended' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.provider_id, 'تم تعليق خدمتك "' || NEW.title || '"', 'service_suspended');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_notify_service_approval
AFTER UPDATE ON public.micro_services
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_service_approval();

-- Add trigger for service purchase notification
CREATE OR REPLACE FUNCTION public.notify_on_service_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _service_title text;
  _provider_id uuid;
BEGIN
  IF NEW.service_id IS NOT NULL THEN
    SELECT title, provider_id INTO _service_title, _provider_id
    FROM micro_services WHERE id = NEW.service_id;
    
    IF _provider_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (_provider_id, 'تم شراء خدمتك "' || _service_title || '" بمبلغ ' || NEW.amount || ' ر.س', 'service_purchased');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_notify_service_purchase
AFTER INSERT ON public.escrow_transactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_service_purchase();
