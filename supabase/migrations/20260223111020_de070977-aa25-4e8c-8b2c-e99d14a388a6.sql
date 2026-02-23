
-- Drop existing triggers first, then recreate
DROP TRIGGER IF EXISTS audit_projects ON public.projects;
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
DROP TRIGGER IF EXISTS audit_bids ON public.bids;
DROP TRIGGER IF EXISTS audit_contracts ON public.contracts;
DROP TRIGGER IF EXISTS audit_escrow_transactions ON public.escrow_transactions;
DROP TRIGGER IF EXISTS audit_disputes ON public.disputes;
DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;
DROP TRIGGER IF EXISTS audit_time_logs ON public.time_logs;
DROP TRIGGER IF EXISTS audit_micro_services ON public.micro_services;
DROP TRIGGER IF EXISTS audit_commission_config ON public.commission_config;
DROP TRIGGER IF EXISTS audit_withdrawal_requests ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS audit_donor_contributions ON public.donor_contributions;
DROP TRIGGER IF EXISTS audit_support_tickets ON public.support_tickets;
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
DROP TRIGGER IF EXISTS audit_categories ON public.categories;
DROP TRIGGER IF EXISTS audit_regions ON public.regions;

CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_bids AFTER INSERT OR UPDATE OR DELETE ON public.bids FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_escrow_transactions AFTER INSERT OR UPDATE OR DELETE ON public.escrow_transactions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_disputes AFTER INSERT OR UPDATE OR DELETE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_time_logs AFTER INSERT OR UPDATE OR DELETE ON public.time_logs FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_micro_services AFTER INSERT OR UPDATE OR DELETE ON public.micro_services FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_commission_config AFTER INSERT OR UPDATE OR DELETE ON public.commission_config FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_withdrawal_requests AFTER INSERT OR UPDATE OR DELETE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_donor_contributions AFTER INSERT OR UPDATE OR DELETE ON public.donor_contributions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_support_tickets AFTER INSERT OR UPDATE OR DELETE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_categories AFTER INSERT OR UPDATE OR DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_regions AFTER INSERT OR UPDATE OR DELETE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
