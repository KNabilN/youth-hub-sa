
-- Add deleted_at to tables that don't have it yet
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Update purge function to include all tables
CREATE OR REPLACE FUNCTION public.purge_soft_deleted_records()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM micro_services WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM projects WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM support_tickets WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM portfolio_items WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM disputes WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM invoices WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM contracts WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM bids WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM ratings WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM profiles WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
END;
$function$;
