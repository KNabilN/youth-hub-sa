-- Add new values to dispute_status enum
ALTER TYPE public.dispute_status ADD VALUE IF NOT EXISTS 'waiting_response';
ALTER TYPE public.dispute_status ADD VALUE IF NOT EXISTS 'info_requested';
ALTER TYPE public.dispute_status ADD VALUE IF NOT EXISTS 'preliminary_decision';
ALTER TYPE public.dispute_status ADD VALUE IF NOT EXISTS 'final_decision';
ALTER TYPE public.dispute_status ADD VALUE IF NOT EXISTS 'archived';