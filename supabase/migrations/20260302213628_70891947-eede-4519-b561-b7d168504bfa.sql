
-- Add deleted_at column to 5 tables
ALTER TABLE public.micro_services ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.support_tickets ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.portfolio_items ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.disputes ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Create purge function
CREATE OR REPLACE FUNCTION public.purge_soft_deleted_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM micro_services WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM projects WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM support_tickets WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM portfolio_items WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
  DELETE FROM disputes WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_micro_services_deleted_at ON public.micro_services (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_projects_deleted_at ON public.projects (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_support_tickets_deleted_at ON public.support_tickets (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_portfolio_items_deleted_at ON public.portfolio_items (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_disputes_deleted_at ON public.disputes (deleted_at) WHERE deleted_at IS NOT NULL;
