
-- Create bank_transfers table
CREATE TABLE public.bank_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid REFERENCES public.escrow_transactions(id) NOT NULL,
  user_id uuid NOT NULL,
  receipt_url text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.bank_transfers ENABLE ROW LEVEL SECURITY;

-- User sees own transfers
CREATE POLICY "Users view own bank transfers"
ON public.bank_transfers FOR SELECT
USING (user_id = auth.uid());

-- User creates own transfers
CREATE POLICY "Users create own bank transfers"
ON public.bank_transfers FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_not_suspended(auth.uid()));

-- Admin manages all
CREATE POLICY "Admin manage all bank transfers"
ON public.bank_transfers FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create private storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('transfer-receipts', 'transfer-receipts', false);

-- Users can upload their own receipts
CREATE POLICY "Users upload own receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'transfer-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own receipts
CREATE POLICY "Users view own receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'transfer-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin can view all receipts
CREATE POLICY "Admin view all receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'transfer-receipts' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Audit trigger for bank_transfers
CREATE TRIGGER audit_bank_transfers
AFTER INSERT OR UPDATE OR DELETE ON public.bank_transfers
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Notification trigger for bank transfer status changes
CREATE OR REPLACE FUNCTION public.notify_on_bank_transfer_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
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
$$;

CREATE TRIGGER notify_bank_transfer_change
AFTER UPDATE ON public.bank_transfers
FOR EACH ROW EXECUTE FUNCTION public.notify_on_bank_transfer_change();
