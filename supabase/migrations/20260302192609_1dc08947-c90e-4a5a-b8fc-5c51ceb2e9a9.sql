
-- Add service_number column to micro_services
ALTER TABLE public.micro_services ADD COLUMN service_number text NOT NULL DEFAULT '';

-- Add dispute_number column to disputes
ALTER TABLE public.disputes ADD COLUMN dispute_number text NOT NULL DEFAULT '';

-- Create trigger function for service numbers
CREATE OR REPLACE FUNCTION public.generate_service_number()
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
  FROM micro_services
  WHERE (created_at AT TIME ZONE 'Asia/Riyadh')::date = _today
    AND service_number IS NOT NULL AND service_number <> '';
  NEW.service_number := 'SV-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Create trigger function for dispute numbers
CREATE OR REPLACE FUNCTION public.generate_dispute_number()
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
  FROM disputes
  WHERE (created_at AT TIME ZONE 'Asia/Riyadh')::date = _today
    AND dispute_number IS NOT NULL AND dispute_number <> '';
  NEW.dispute_number := 'DS-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER set_service_number
BEFORE INSERT ON public.micro_services
FOR EACH ROW
EXECUTE FUNCTION public.generate_service_number();

CREATE TRIGGER set_dispute_number
BEFORE INSERT ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.generate_dispute_number();

-- Backfill existing services using CTE
WITH numbered AS (
  SELECT id,
    'SV-' || to_char((created_at AT TIME ZONE 'Asia/Riyadh')::date, 'YYYYMMDD') || '-' || lpad(
      (ROW_NUMBER() OVER (PARTITION BY (created_at AT TIME ZONE 'Asia/Riyadh')::date ORDER BY created_at))::text, 4, '0'
    ) AS sn
  FROM micro_services
)
UPDATE micro_services SET service_number = numbered.sn FROM numbered WHERE micro_services.id = numbered.id;

-- Backfill existing disputes using CTE
WITH numbered AS (
  SELECT id,
    'DS-' || to_char((created_at AT TIME ZONE 'Asia/Riyadh')::date, 'YYYYMMDD') || '-' || lpad(
      (ROW_NUMBER() OVER (PARTITION BY (created_at AT TIME ZONE 'Asia/Riyadh')::date ORDER BY created_at))::text, 4, '0'
    ) AS dn
  FROM disputes
)
UPDATE disputes SET dispute_number = numbered.dn FROM numbered WHERE disputes.id = numbered.id;
