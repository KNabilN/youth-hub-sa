
-- 1. Fix notifications INSERT policy: block direct client inserts, only SECURITY DEFINER triggers can insert
DROP POLICY IF EXISTS "Authenticated users insert notifications" ON public.notifications;
CREATE POLICY "Only server triggers insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 2. Fix attachments storage: path-scoped SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view attachments" ON storage.objects;
CREATE POLICY "Users view own folder attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admin can view all attachments in storage
CREATE POLICY "Admin view all attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'attachments' AND public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- 3. Restrict user_roles enumeration: drop broad policy
DROP POLICY IF EXISTS "Authenticated users can view all roles" ON public.user_roles;

-- 4. Trigger for profile financial changes → notify admins automatically
CREATE OR REPLACE FUNCTION public.notify_on_profile_financial_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _display_name text;
  _admin record;
BEGIN
  -- Only fire if bank fields actually changed and profile was verified
  IF OLD.is_verified = true AND (
    OLD.bank_name IS DISTINCT FROM NEW.bank_name OR
    OLD.bank_account_number IS DISTINCT FROM NEW.bank_account_number OR
    OLD.bank_iban IS DISTINCT FROM NEW.bank_iban OR
    OLD.bank_account_holder IS DISTINCT FROM NEW.bank_account_holder
  ) THEN
    _display_name := COALESCE(NEW.organization_name, NEW.full_name, 'مستخدم');
    FOR _admin IN SELECT user_id FROM user_roles WHERE role = 'super_admin'
    LOOP
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (_admin.user_id, 'قام ' || _display_name || ' بتعديل بياناته المالية ويحتاج مراجعة وإعادة توثيق', 'profile_updated', NEW.id, 'profile');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_profile_financial_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_profile_financial_change();
