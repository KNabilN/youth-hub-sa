
-- Add defaults so the generated types don't require these fields on insert
ALTER TABLE public.support_tickets ALTER COLUMN ticket_number SET DEFAULT '';
ALTER TABLE public.projects ALTER COLUMN request_number SET DEFAULT '';

-- Update triggers to also fire when value is empty string
DROP TRIGGER IF EXISTS trg_generate_ticket_number ON public.support_tickets;
CREATE TRIGGER trg_generate_ticket_number
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
EXECUTE FUNCTION public.generate_ticket_number();

DROP TRIGGER IF EXISTS trg_generate_request_number ON public.projects;
CREATE TRIGGER trg_generate_request_number
BEFORE INSERT ON public.projects
FOR EACH ROW
WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
EXECUTE FUNCTION public.generate_request_number();
