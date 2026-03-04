
-- Add user_number column
ALTER TABLE public.profiles ADD COLUMN user_number text NOT NULL DEFAULT '';

-- Create trigger function
CREATE OR REPLACE FUNCTION public.generate_user_number()
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
  FROM profiles
  WHERE (created_at AT TIME ZONE 'Asia/Riyadh')::date = _today
    AND user_number IS NOT NULL AND user_number <> '';
  NEW.user_number := 'USR-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trg_generate_user_number
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_user_number();

-- Backfill existing users
WITH numbered AS (
  SELECT id, created_at,
    ROW_NUMBER() OVER (PARTITION BY (created_at AT TIME ZONE 'Asia/Riyadh')::date ORDER BY created_at) as seq
  FROM profiles
  WHERE user_number IS NULL OR user_number = ''
)
UPDATE profiles p
SET user_number = 'USR-' || to_char((n.created_at AT TIME ZONE 'Asia/Riyadh')::date, 'YYYYMMDD') || '-' || lpad(n.seq::text, 4, '0')
FROM numbered n
WHERE p.id = n.id;
