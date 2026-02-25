
-- Add start_time, end_time, rejection_reason to time_logs
ALTER TABLE public.time_logs
  ADD COLUMN IF NOT EXISTS start_time time DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS end_time time DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason text DEFAULT ''::text;
