
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS license_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_officer_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_officer_phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_officer_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_officer_title text DEFAULT '';
