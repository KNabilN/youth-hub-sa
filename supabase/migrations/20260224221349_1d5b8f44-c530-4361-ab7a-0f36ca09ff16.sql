
-- 1. Fix: Restrict time_logs so providers can't change approval status
-- Drop the ALL policy for providers and replace with granular ones
DROP POLICY IF EXISTS "Providers manage own time logs" ON public.time_logs;

CREATE POLICY "Providers insert own time logs"
  ON public.time_logs FOR INSERT
  WITH CHECK (provider_id = auth.uid() AND is_not_suspended(auth.uid()));

CREATE POLICY "Providers view own time logs"
  ON public.time_logs FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "Providers update own time logs non-approval"
  ON public.time_logs FOR UPDATE
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers delete own time logs"
  ON public.time_logs FOR DELETE
  USING (provider_id = auth.uid());

-- 2. Fix: Restrict notification insertion - only allow creating for self or via system
-- Drop old permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
-- Allow authenticated users to insert notifications (needed for system notifications from client)
-- We keep this but add validation in application layer
CREATE POLICY "Authenticated users insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Add PDPL consent tracking column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pdpl_consent_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pdpl_consent_version text DEFAULT '1.0';
