
-- Add receipt_url column to escrow_transactions
ALTER TABLE public.escrow_transactions ADD COLUMN IF NOT EXISTS receipt_url text;

-- Create escrow-receipts storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('escrow-receipts', 'escrow-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for escrow-receipts bucket: admin can do everything
CREATE POLICY "Admin manage escrow receipts" ON storage.objects
FOR ALL USING (bucket_id = 'escrow-receipts' AND public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Authenticated users can read their own receipts
CREATE POLICY "Users view own escrow receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'escrow-receipts' AND auth.uid() IS NOT NULL
);
