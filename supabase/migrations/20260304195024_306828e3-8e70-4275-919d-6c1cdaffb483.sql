
-- Add withdrawal_number column
ALTER TABLE public.withdrawal_requests
  ADD COLUMN withdrawal_number text NOT NULL DEFAULT '';

-- Create trigger function
CREATE OR REPLACE FUNCTION public.generate_withdrawal_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
DECLARE
  _today date;
  _seq int;
BEGIN
  _today := (NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date;
  SELECT COUNT(*) + 1 INTO _seq
  FROM withdrawal_requests
  WHERE (created_at AT TIME ZONE 'Asia/Riyadh')::date = _today
    AND withdrawal_number IS NOT NULL AND withdrawal_number <> '';
  NEW.withdrawal_number := 'WD-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trg_generate_withdrawal_number
  BEFORE INSERT ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_withdrawal_number();
