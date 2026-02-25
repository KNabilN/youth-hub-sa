-- Add suspension_reason to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason text DEFAULT '';
