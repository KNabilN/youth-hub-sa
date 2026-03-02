
-- Add ticket_number to support_tickets
ALTER TABLE public.support_tickets ADD COLUMN ticket_number text;

-- Add request_number to projects
ALTER TABLE public.projects ADD COLUMN request_number text;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  _today := (NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date;
  SELECT COUNT(*) + 1 INTO _seq
  FROM support_tickets
  WHERE (created_at AT TIME ZONE 'Asia/Riyadh')::date = _today
    AND ticket_number IS NOT NULL;
  NEW.ticket_number := 'TK-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

-- Trigger for ticket number
CREATE TRIGGER trg_generate_ticket_number
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
WHEN (NEW.ticket_number IS NULL)
EXECUTE FUNCTION public.generate_ticket_number();

-- Function to generate request number
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  _today := (NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date;
  SELECT COUNT(*) + 1 INTO _seq
  FROM projects
  WHERE (created_at AT TIME ZONE 'Asia/Riyadh')::date = _today
    AND request_number IS NOT NULL;
  NEW.request_number := 'RQ-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

-- Trigger for request number
CREATE TRIGGER trg_generate_request_number
BEFORE INSERT ON public.projects
FOR EACH ROW
WHEN (NEW.request_number IS NULL)
EXECUTE FUNCTION public.generate_request_number();

-- Backfill existing tickets
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY (created_at AT TIME ZONE 'Asia/Riyadh')::date
    ORDER BY created_at
  ) AS seq,
  (created_at AT TIME ZONE 'Asia/Riyadh')::date AS day
  FROM support_tickets
  WHERE ticket_number IS NULL
)
UPDATE support_tickets t
SET ticket_number = 'TK-' || to_char(n.day, 'YYYYMMDD') || '-' || lpad(n.seq::text, 4, '0')
FROM numbered n
WHERE t.id = n.id;

-- Backfill existing projects
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY (created_at AT TIME ZONE 'Asia/Riyadh')::date
    ORDER BY created_at
  ) AS seq,
  (created_at AT TIME ZONE 'Asia/Riyadh')::date AS day
  FROM projects
  WHERE request_number IS NULL
)
UPDATE projects p
SET request_number = 'RQ-' || to_char(n.day, 'YYYYMMDD') || '-' || lpad(n.seq::text, 4, '0')
FROM numbered n
WHERE p.id = n.id;

-- Now add constraints
ALTER TABLE public.support_tickets ALTER COLUMN ticket_number SET NOT NULL;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_ticket_number_unique UNIQUE (ticket_number);

ALTER TABLE public.projects ALTER COLUMN request_number SET NOT NULL;
ALTER TABLE public.projects ADD CONSTRAINT projects_request_number_unique UNIQUE (request_number);
