-- Make ID-number generation atomic and RLS-safe across all numbered entities
-- Pattern: SECURITY DEFINER + advisory transaction lock + MAX(suffix)+1

CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  IF NEW.request_number IS NOT NULL AND btrim(NEW.request_number) <> '' THEN
    RETURN NEW;
  END IF;

  _today := COALESCE((NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date, (now() AT TIME ZONE 'Asia/Riyadh')::date);

  PERFORM pg_advisory_xact_lock(hashtext('projects_request_number'), to_char(_today, 'YYYYMMDD')::int);

  SELECT COALESCE(MAX((substring(request_number FROM '([0-9]+)$'))::int), 0) + 1
  INTO _seq
  FROM public.projects
  WHERE request_number LIKE 'RQ-' || to_char(_today, 'YYYYMMDD') || '-%';

  NEW.request_number := 'RQ-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  IF NEW.ticket_number IS NOT NULL AND btrim(NEW.ticket_number) <> '' THEN
    RETURN NEW;
  END IF;

  _today := COALESCE((NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date, (now() AT TIME ZONE 'Asia/Riyadh')::date);

  PERFORM pg_advisory_xact_lock(hashtext('support_tickets_ticket_number'), to_char(_today, 'YYYYMMDD')::int);

  SELECT COALESCE(MAX((substring(ticket_number FROM '([0-9]+)$'))::int), 0) + 1
  INTO _seq
  FROM public.support_tickets
  WHERE ticket_number LIKE 'TK-' || to_char(_today, 'YYYYMMDD') || '-%';

  NEW.ticket_number := 'TK-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_service_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  IF NEW.service_number IS NOT NULL AND btrim(NEW.service_number) <> '' THEN
    RETURN NEW;
  END IF;

  _today := COALESCE((NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date, (now() AT TIME ZONE 'Asia/Riyadh')::date);

  PERFORM pg_advisory_xact_lock(hashtext('micro_services_service_number'), to_char(_today, 'YYYYMMDD')::int);

  SELECT COALESCE(MAX((substring(service_number FROM '([0-9]+)$'))::int), 0) + 1
  INTO _seq
  FROM public.micro_services
  WHERE service_number LIKE 'SV-' || to_char(_today, 'YYYYMMDD') || '-%';

  NEW.service_number := 'SV-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_dispute_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  IF NEW.dispute_number IS NOT NULL AND btrim(NEW.dispute_number) <> '' THEN
    RETURN NEW;
  END IF;

  _today := COALESCE((NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date, (now() AT TIME ZONE 'Asia/Riyadh')::date);

  PERFORM pg_advisory_xact_lock(hashtext('disputes_dispute_number'), to_char(_today, 'YYYYMMDD')::int);

  SELECT COALESCE(MAX((substring(dispute_number FROM '([0-9]+)$'))::int), 0) + 1
  INTO _seq
  FROM public.disputes
  WHERE dispute_number LIKE 'DS-' || to_char(_today, 'YYYYMMDD') || '-%';

  NEW.dispute_number := 'DS-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_escrow_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  IF NEW.escrow_number IS NOT NULL AND btrim(NEW.escrow_number) <> '' THEN
    RETURN NEW;
  END IF;

  _today := COALESCE((NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date, (now() AT TIME ZONE 'Asia/Riyadh')::date);

  PERFORM pg_advisory_xact_lock(hashtext('escrow_transactions_escrow_number'), to_char(_today, 'YYYYMMDD')::int);

  SELECT COALESCE(MAX((substring(escrow_number FROM '([0-9]+)$'))::int), 0) + 1
  INTO _seq
  FROM public.escrow_transactions
  WHERE escrow_number LIKE 'ES-' || to_char(_today, 'YYYYMMDD') || '-%';

  NEW.escrow_number := 'ES-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_transfer_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  IF NEW.transfer_number IS NOT NULL AND btrim(NEW.transfer_number) <> '' THEN
    RETURN NEW;
  END IF;

  _today := COALESCE((NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date, (now() AT TIME ZONE 'Asia/Riyadh')::date);

  PERFORM pg_advisory_xact_lock(hashtext('bank_transfers_transfer_number'), to_char(_today, 'YYYYMMDD')::int);

  SELECT COALESCE(MAX((substring(transfer_number FROM '([0-9]+)$'))::int), 0) + 1
  INTO _seq
  FROM public.bank_transfers
  WHERE transfer_number LIKE 'BT-' || to_char(_today, 'YYYYMMDD') || '-%';

  NEW.transfer_number := 'BT-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_withdrawal_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  IF NEW.withdrawal_number IS NOT NULL AND btrim(NEW.withdrawal_number) <> '' THEN
    RETURN NEW;
  END IF;

  _today := COALESCE((NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date, (now() AT TIME ZONE 'Asia/Riyadh')::date);

  PERFORM pg_advisory_xact_lock(hashtext('withdrawal_requests_withdrawal_number'), to_char(_today, 'YYYYMMDD')::int);

  SELECT COALESCE(MAX((substring(withdrawal_number FROM '([0-9]+)$'))::int), 0) + 1
  INTO _seq
  FROM public.withdrawal_requests
  WHERE withdrawal_number LIKE 'WD-' || to_char(_today, 'YYYYMMDD') || '-%';

  NEW.withdrawal_number := 'WD-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

-- Also harden user number generation (same concurrency/RLS pattern)
CREATE OR REPLACE FUNCTION public.generate_user_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _today date;
  _seq int;
BEGIN
  IF NEW.user_number IS NOT NULL AND btrim(NEW.user_number) <> '' THEN
    RETURN NEW;
  END IF;

  _today := COALESCE((NEW.created_at AT TIME ZONE 'Asia/Riyadh')::date, (now() AT TIME ZONE 'Asia/Riyadh')::date);

  PERFORM pg_advisory_xact_lock(hashtext('profiles_user_number'), to_char(_today, 'YYYYMMDD')::int);

  SELECT COALESCE(MAX((substring(user_number FROM '([0-9]+)$'))::int), 0) + 1
  INTO _seq
  FROM public.profiles
  WHERE user_number LIKE 'USR-' || to_char(_today, 'YYYYMMDD') || '-%';

  NEW.user_number := 'USR-' || to_char(_today, 'YYYYMMDD') || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$function$;

-- Recreate numbering triggers with explicit WHEN guard (only when number is empty)
DROP TRIGGER IF EXISTS trg_generate_request_number ON public.projects;
CREATE TRIGGER trg_generate_request_number
BEFORE INSERT ON public.projects
FOR EACH ROW
WHEN (NEW.request_number IS NULL OR btrim(NEW.request_number) = '')
EXECUTE FUNCTION public.generate_request_number();

DROP TRIGGER IF EXISTS trg_generate_ticket_number ON public.support_tickets;
CREATE TRIGGER trg_generate_ticket_number
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
WHEN (NEW.ticket_number IS NULL OR btrim(NEW.ticket_number) = '')
EXECUTE FUNCTION public.generate_ticket_number();

DROP TRIGGER IF EXISTS trg_generate_service_number ON public.micro_services;
CREATE TRIGGER trg_generate_service_number
BEFORE INSERT ON public.micro_services
FOR EACH ROW
WHEN (NEW.service_number IS NULL OR btrim(NEW.service_number) = '')
EXECUTE FUNCTION public.generate_service_number();

DROP TRIGGER IF EXISTS trg_generate_dispute_number ON public.disputes;
CREATE TRIGGER trg_generate_dispute_number
BEFORE INSERT ON public.disputes
FOR EACH ROW
WHEN (NEW.dispute_number IS NULL OR btrim(NEW.dispute_number) = '')
EXECUTE FUNCTION public.generate_dispute_number();

DROP TRIGGER IF EXISTS trg_generate_escrow_number ON public.escrow_transactions;
CREATE TRIGGER trg_generate_escrow_number
BEFORE INSERT ON public.escrow_transactions
FOR EACH ROW
WHEN (NEW.escrow_number IS NULL OR btrim(NEW.escrow_number) = '')
EXECUTE FUNCTION public.generate_escrow_number();

DROP TRIGGER IF EXISTS trg_generate_transfer_number ON public.bank_transfers;
CREATE TRIGGER trg_generate_transfer_number
BEFORE INSERT ON public.bank_transfers
FOR EACH ROW
WHEN (NEW.transfer_number IS NULL OR btrim(NEW.transfer_number) = '')
EXECUTE FUNCTION public.generate_transfer_number();

DROP TRIGGER IF EXISTS trg_generate_withdrawal_number ON public.withdrawal_requests;
CREATE TRIGGER trg_generate_withdrawal_number
BEFORE INSERT ON public.withdrawal_requests
FOR EACH ROW
WHEN (NEW.withdrawal_number IS NULL OR btrim(NEW.withdrawal_number) = '')
EXECUTE FUNCTION public.generate_withdrawal_number();

DROP TRIGGER IF EXISTS trg_generate_user_number ON public.profiles;
CREATE TRIGGER trg_generate_user_number
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.user_number IS NULL OR btrim(NEW.user_number) = '')
EXECUTE FUNCTION public.generate_user_number();