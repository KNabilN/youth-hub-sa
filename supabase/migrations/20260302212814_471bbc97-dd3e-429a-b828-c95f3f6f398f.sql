
-- Update bank transfer trigger to also notify admins on INSERT
CREATE OR REPLACE FUNCTION public.notify_on_bank_transfer_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _admin record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Notify all admins about new bank transfer
    FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
    LOOP
      INSERT INTO notifications (user_id, message, type)
      VALUES (_admin.user_id, 'تحويل بنكي جديد بمبلغ ' || NEW.amount || ' ر.س بانتظار المراجعة', 'bank_transfer_pending');
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.user_id, 'تمت الموافقة على التحويل البنكي بمبلغ ' || NEW.amount || ' ر.س', 'bank_transfer_approved');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.user_id, 'تم رفض التحويل البنكي بمبلغ ' || NEW.amount || ' ر.س' || CASE WHEN NEW.admin_note <> '' THEN '. السبب: ' || NEW.admin_note ELSE '' END, 'bank_transfer_rejected');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger fires on both INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_notify_bank_transfer ON public.bank_transfers;
CREATE TRIGGER trg_notify_bank_transfer
  AFTER INSERT OR UPDATE ON public.bank_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_bank_transfer_change();
