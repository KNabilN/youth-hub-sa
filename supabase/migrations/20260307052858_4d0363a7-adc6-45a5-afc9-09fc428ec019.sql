CREATE OR REPLACE FUNCTION public.notify_on_invoice_create()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
  VALUES (
    NEW.issued_to,
    'تم إصدار فاتورة جديدة رقم ' || NEW.invoice_number || ' بمبلغ ' || NEW.amount || ' ر.س',
    'invoice_created',
    NEW.id,
    'invoice'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_invoice_create
AFTER INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.notify_on_invoice_create();