ALTER TABLE public.profiles
  ADD COLUMN notification_preferences jsonb DEFAULT '{}'::jsonb;