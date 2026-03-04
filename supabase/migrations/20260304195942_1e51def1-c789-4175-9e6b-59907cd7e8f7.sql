
-- 1. Add columns to withdrawal_requests
ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS receipt_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rejection_reason text DEFAULT '';

-- 2. Create storage bucket for withdrawal receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('withdrawal-receipts', 'withdrawal-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS: admins can upload
CREATE POLICY "Admin upload withdrawal receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'withdrawal-receipts' AND
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- 4. Storage RLS: admins can read all, providers can read their own
CREATE POLICY "Admin read withdrawal receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'withdrawal-receipts' AND
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

CREATE POLICY "Provider read own withdrawal receipt"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'withdrawal-receipts' AND
  EXISTS (
    SELECT 1 FROM public.withdrawal_requests wr
    WHERE wr.provider_id = auth.uid()
      AND wr.receipt_url = name
  )
);

-- 5. Update withdrawal notification trigger to include rejection reason
CREATE OR REPLACE FUNCTION public.notify_on_withdrawal_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.provider_id,
      CASE NEW.status
        WHEN 'approved' THEN 'تمت الموافقة على طلب السحب بمبلغ ' || NEW.amount || ' ر.س'
        WHEN 'rejected' THEN 'تم رفض طلب السحب بمبلغ ' || NEW.amount || ' ر.س' || CASE WHEN NEW.rejection_reason <> '' THEN '. السبب: ' || NEW.rejection_reason ELSE '' END
        WHEN 'processed' THEN 'تم تحويل مبلغ ' || NEW.amount || ' ر.س إلى حسابك'
        ELSE 'تم تحديث حالة طلب السحب'
      END,
      'withdrawal_' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$;
