
-- =============================================
-- STAGE 2: CORE DATABASE & DOMAIN MODELS
-- =============================================

-- 1. ENUMS
CREATE TYPE public.project_status AS ENUM ('draft','open','in_progress','completed','disputed','cancelled');
CREATE TYPE public.bid_status AS ENUM ('pending','accepted','rejected','withdrawn');
CREATE TYPE public.service_type AS ENUM ('fixed_price','hourly');
CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.dispute_status AS ENUM ('open','under_review','resolved','closed');
CREATE TYPE public.escrow_status AS ENUM ('held','released','frozen','refunded');
CREATE TYPE public.ticket_status AS ENUM ('open','in_progress','resolved','closed');
CREATE TYPE public.ticket_priority AS ENUM ('low','medium','high','urgent');

-- 2. LOOKUP TABLES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read regions" ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage regions" ON public.regions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3. PROJECTS
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.profiles(id),
  assigned_provider_id uuid REFERENCES public.profiles(id),
  category_id uuid REFERENCES public.categories(id),
  region_id uuid REFERENCES public.regions(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  required_skills text[] DEFAULT '{}',
  estimated_hours numeric(8,2),
  budget numeric(12,2),
  status public.project_status NOT NULL DEFAULT 'draft',
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_association ON public.projects(association_id);
CREATE INDEX idx_projects_status ON public.projects(status);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Associations manage own projects" ON public.projects FOR ALL TO authenticated USING (association_id = auth.uid());
CREATE POLICY "Providers see open projects" ON public.projects FOR SELECT TO authenticated USING (status = 'open' AND is_private = false AND public.has_role(auth.uid(), 'service_provider'::app_role));
CREATE POLICY "Assigned provider sees project" ON public.projects FOR SELECT TO authenticated USING (assigned_provider_id = auth.uid());
CREATE POLICY "Donors see open projects" ON public.projects FOR SELECT TO authenticated USING (status = 'open' AND is_private = false AND public.has_role(auth.uid(), 'donor'::app_role));
CREATE POLICY "Admin manage all projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 4. MICRO SERVICES
CREATE TABLE public.micro_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles(id),
  category_id uuid REFERENCES public.categories(id),
  region_id uuid REFERENCES public.regions(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  service_type public.service_type NOT NULL DEFAULT 'fixed_price',
  price numeric(12,2) NOT NULL,
  approval public.approval_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_micro_services_provider ON public.micro_services(provider_id);
CREATE INDEX idx_micro_services_approval ON public.micro_services(approval);
ALTER TABLE public.micro_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own services" ON public.micro_services FOR ALL TO authenticated USING (provider_id = auth.uid());
CREATE POLICY "Browse approved services" ON public.micro_services FOR SELECT TO authenticated USING (approval = 'approved');
CREATE POLICY "Admin manage all services" ON public.micro_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 5. BIDS
CREATE TABLE public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.profiles(id),
  price numeric(12,2) NOT NULL,
  timeline_days integer NOT NULL,
  cover_letter text NOT NULL DEFAULT '',
  status public.bid_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bids_project ON public.bids(project_id);
CREATE INDEX idx_bids_provider ON public.bids(provider_id);
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own bids" ON public.bids FOR ALL TO authenticated USING (provider_id = auth.uid());
CREATE POLICY "Associations see bids on own projects" ON public.bids FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = bids.project_id AND projects.association_id = auth.uid()));
CREATE POLICY "Admin manage all bids" ON public.bids FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 6. CONTRACTS
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  association_id uuid NOT NULL REFERENCES public.profiles(id),
  provider_id uuid NOT NULL REFERENCES public.profiles(id),
  terms text NOT NULL DEFAULT '',
  association_signed_at timestamptz,
  provider_signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_contracts_project ON public.contracts(project_id);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract parties can view" ON public.contracts FOR SELECT TO authenticated USING (association_id = auth.uid() OR provider_id = auth.uid());
CREATE POLICY "Admin manage all contracts" ON public.contracts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 7. TIME LOGS
CREATE TABLE public.time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  provider_id uuid NOT NULL REFERENCES public.profiles(id),
  hours numeric(6,2) NOT NULL,
  description text NOT NULL DEFAULT '',
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  approval public.approval_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_logs_project ON public.time_logs(project_id);
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own time logs" ON public.time_logs FOR ALL TO authenticated USING (provider_id = auth.uid());
CREATE POLICY "Associations see time logs on own projects" ON public.time_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = time_logs.project_id AND projects.association_id = auth.uid()));
CREATE POLICY "Associations update time log approval" ON public.time_logs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = time_logs.project_id AND projects.association_id = auth.uid()));
CREATE POLICY "Admin manage all time logs" ON public.time_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 8. RATINGS
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id),
  rater_id uuid NOT NULL REFERENCES public.profiles(id),
  quality_score smallint NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  timing_score smallint NOT NULL CHECK (timing_score BETWEEN 1 AND 5),
  communication_score smallint NOT NULL CHECK (communication_score BETWEEN 1 AND 5),
  comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ratings_contract ON public.ratings(contract_id);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rater can insert rating" ON public.ratings FOR INSERT TO authenticated WITH CHECK (rater_id = auth.uid());
CREATE POLICY "Public read ratings" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage all ratings" ON public.ratings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 9. DISPUTES
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  raised_by uuid NOT NULL REFERENCES public.profiles(id),
  description text NOT NULL DEFAULT '',
  status public.dispute_status NOT NULL DEFAULT 'open',
  resolution_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_disputes_project ON public.disputes(project_id);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved parties view disputes" ON public.disputes FOR SELECT TO authenticated USING (raised_by = auth.uid() OR EXISTS (SELECT 1 FROM public.projects WHERE projects.id = disputes.project_id AND (projects.association_id = auth.uid() OR projects.assigned_provider_id = auth.uid())));
CREATE POLICY "Users can create disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (raised_by = auth.uid());
CREATE POLICY "Admin manage all disputes" ON public.disputes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 10. ESCROW TRANSACTIONS (before audit log triggers)
CREATE TABLE public.escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id),
  service_id uuid REFERENCES public.micro_services(id),
  payer_id uuid NOT NULL REFERENCES public.profiles(id),
  payee_id uuid NOT NULL REFERENCES public.profiles(id),
  amount numeric(12,2) NOT NULL,
  status public.escrow_status NOT NULL DEFAULT 'held',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_escrow_project ON public.escrow_transactions(project_id);
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties view own escrow" ON public.escrow_transactions FOR SELECT TO authenticated USING (payer_id = auth.uid() OR payee_id = auth.uid());
CREATE POLICY "Admin manage all escrow" ON public.escrow_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 11. AUDIT LOG
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  actor_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_record ON public.audit_log(record_id);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, new_values, actor_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, actor_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_values, actor_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach audit triggers
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_escrow AFTER INSERT OR UPDATE OR DELETE ON public.escrow_transactions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_disputes AFTER INSERT OR UPDATE OR DELETE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- 12. INVOICES
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid REFERENCES public.escrow_transactions(id),
  invoice_number text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  issued_to uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User views own invoices" ON public.invoices FOR SELECT TO authenticated USING (issued_to = auth.uid());
CREATE POLICY "Admin manage all invoices" ON public.invoices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 13. COMMISSION CONFIG
CREATE TABLE public.commission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate numeric(5,4) NOT NULL DEFAULT 0.05,
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage commission config" ON public.commission_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Authenticated read commission config" ON public.commission_config FOR SELECT TO authenticated USING (is_active = true);

-- 14. DONOR CONTRIBUTIONS
CREATE TABLE public.donor_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES public.profiles(id),
  project_id uuid REFERENCES public.projects(id),
  service_id uuid REFERENCES public.micro_services(id),
  amount numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_contributions_donor ON public.donor_contributions(donor_id);
ALTER TABLE public.donor_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors manage own contributions" ON public.donor_contributions FOR ALL TO authenticated USING (donor_id = auth.uid());
CREATE POLICY "Associations see contributions to own projects" ON public.donor_contributions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = donor_contributions.project_id AND projects.association_id = auth.uid()));
CREATE POLICY "Admin manage all contributions" ON public.donor_contributions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 15. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  type text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin manage all notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 16. SUPPORT TICKETS
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  subject text NOT NULL,
  description text NOT NULL DEFAULT '',
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_user ON public.support_tickets(user_id);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tickets" ON public.support_tickets FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin manage all tickets" ON public.support_tickets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'::app_role));
