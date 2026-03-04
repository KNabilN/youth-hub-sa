
-- Add escrow_number column
ALTER TABLE public.escrow_transactions
  ADD COLUMN escrow_number text NOT NULL DEFAULT '';

-- Add transfer_number column  
ALTER TABLE public.bank_transfers
  ADD COLUMN transfer_number text NOT NULL DEFAULT '';

-- Create escrow number trigger function
CREATE OR REPLACE FUNCTION public.generate_escrow_number()
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
  FROM escrow_transactions
  WHERE (created_at AT TIME ZONE 'Asia/Riyadh')::date = _today
    AND escrow_number IS NOT NULL AND escrow_number <> '';
  NEW.escrow_number := 'ES-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Create bank transfer number trigger function
CREATE OR REPLACE FUNCTION public.generate_transfer_number()
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
  FROM bank_transfers
  WHERE (created_at AT TIME ZONE 'Asia/Riyadh')::date = _today
    AND transfer_number IS NOT NULL AND transfer_number <> '';
  NEW.transfer_number := 'BT-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_generate_escrow_number
  BEFORE INSERT ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_escrow_number();

CREATE TRIGGER trg_generate_transfer_number
  BEFORE INSERT ON public.bank_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_transfer_number();
