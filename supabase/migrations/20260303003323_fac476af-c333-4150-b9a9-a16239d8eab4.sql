ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_iban text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_holder text DEFAULT '';