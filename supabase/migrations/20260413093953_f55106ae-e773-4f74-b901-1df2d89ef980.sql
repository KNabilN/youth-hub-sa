
-- 1. Create bank_details table
CREATE TABLE public.bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bank_name text DEFAULT '',
  bank_account_number text DEFAULT '',
  bank_iban text DEFAULT '',
  bank_account_holder text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

-- 2. RLS policies
CREATE POLICY "Owner read own bank details" ON public.bank_details FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Owner insert own bank details" ON public.bank_details FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner update own bank details" ON public.bank_details FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- 3. Migrate existing data
INSERT INTO public.bank_details (user_id, bank_name, bank_account_number, bank_iban, bank_account_holder)
SELECT id,
  COALESCE(bank_name, ''),
  COALESCE(bank_account_number, ''),
  COALESCE(bank_iban, ''),
  COALESCE(bank_account_holder, '')
FROM public.profiles
WHERE COALESCE(bank_name, '') != ''
   OR COALESCE(bank_account_number, '') != ''
   OR COALESCE(bank_iban, '') != ''
   OR COALESCE(bank_account_holder, '') != '';

-- 4. Drop old columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bank_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bank_account_number;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bank_iban;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bank_account_holder;

-- 5. Drop old trigger on profiles
DROP TRIGGER IF EXISTS trg_notify_profile_financial_change ON public.profiles;

-- 6. Create new trigger on bank_details
CREATE OR REPLACE FUNCTION public.notify_on_bank_details_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _display_name text;
  _is_verified boolean;
  _admin record;
BEGIN
  -- Check if user was verified
  SELECT is_verified, COALESCE(organization_name, full_name, 'مستخدم')
  INTO _is_verified, _display_name
  FROM profiles WHERE id = NEW.user_id;

  IF _is_verified = true AND (
    OLD.bank_name IS DISTINCT FROM NEW.bank_name OR
    OLD.bank_account_number IS DISTINCT FROM NEW.bank_account_number OR
    OLD.bank_iban IS DISTINCT FROM NEW.bank_iban OR
    OLD.bank_account_holder IS DISTINCT FROM NEW.bank_account_holder
  ) THEN
    -- Reset verification
    UPDATE profiles SET is_verified = false WHERE id = NEW.user_id;

    -- Notify admins
    FOR _admin IN SELECT user_id FROM user_roles WHERE role = 'super_admin'
    LOOP
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (_admin.user_id, 'قام ' || _display_name || ' بتعديل بياناته المالية ويحتاج مراجعة وإعادة توثيق', 'profile_updated', NEW.user_id, 'profile');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_bank_details_change
  AFTER UPDATE ON public.bank_details
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_bank_details_change();

-- 7. Drop old function
DROP FUNCTION IF EXISTS public.notify_on_profile_financial_change();
