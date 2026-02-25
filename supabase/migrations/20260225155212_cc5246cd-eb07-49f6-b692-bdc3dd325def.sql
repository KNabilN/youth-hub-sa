-- Add status and notes tracking to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'issued',
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL;

-- Add invoice template settings to site_content if not exists
INSERT INTO public.site_content (section_key, content)
VALUES ('invoice_template', '{"company_name":"منصة الشباب","company_name_en":"Youth Hub SA","vat_number":"300000000000003","cr_number":"1234567890","address":"المملكة العربية السعودية","footer_text":"هذه فاتورة إلكترونية صادرة من النظام ولا تحتاج لتوقيع.","logo_url":""}')
ON CONFLICT (section_key) DO NOTHING;