
-- Drop any existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS trg_generate_ticket_number ON public.support_tickets;
DROP TRIGGER IF EXISTS trg_generate_request_number ON public.projects;
DROP TRIGGER IF EXISTS trg_generate_service_number ON public.micro_services;
DROP TRIGGER IF EXISTS trg_generate_dispute_number ON public.disputes;
DROP TRIGGER IF EXISTS trg_notify_on_bid_change ON public.bids;
DROP TRIGGER IF EXISTS trg_notify_on_contract_change ON public.contracts;
DROP TRIGGER IF EXISTS trg_notify_on_escrow_change ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_notify_on_bank_transfer_change ON public.bank_transfers;
DROP TRIGGER IF EXISTS trg_notify_on_project_status_change ON public.projects;
DROP TRIGGER IF EXISTS trg_notify_on_dispute_change ON public.disputes;
DROP TRIGGER IF EXISTS trg_notify_on_timelog_approval ON public.time_logs;
DROP TRIGGER IF EXISTS trg_notify_on_withdrawal_change ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS trg_notify_on_new_message ON public.messages;
DROP TRIGGER IF EXISTS trg_notify_on_deliverable_change ON public.project_deliverables;
DROP TRIGGER IF EXISTS trg_notify_on_service_approval ON public.micro_services;
DROP TRIGGER IF EXISTS trg_notify_on_service_purchase ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_increment_service_sales ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_log_dispute_status_change ON public.disputes;
DROP TRIGGER IF EXISTS trg_create_ticket_from_contact ON public.contact_messages;
DROP TRIGGER IF EXISTS trg_update_support_ticket_updated_at ON public.support_tickets;
DROP TRIGGER IF EXISTS trg_audit_projects ON public.projects;
DROP TRIGGER IF EXISTS trg_audit_escrow ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_audit_contracts ON public.contracts;

-- Now create all triggers
CREATE TRIGGER trg_notify_on_bid_change AFTER INSERT OR UPDATE ON public.bids FOR EACH ROW EXECUTE FUNCTION public.notify_on_bid_change();
CREATE TRIGGER trg_notify_on_contract_change AFTER INSERT OR UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.notify_on_contract_change();
CREATE TRIGGER trg_notify_on_escrow_change AFTER INSERT OR UPDATE ON public.escrow_transactions FOR EACH ROW EXECUTE FUNCTION public.notify_on_escrow_change();
CREATE TRIGGER trg_notify_on_bank_transfer_change AFTER INSERT OR UPDATE ON public.bank_transfers FOR EACH ROW EXECUTE FUNCTION public.notify_on_bank_transfer_change();
CREATE TRIGGER trg_notify_on_project_status_change AFTER UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.notify_on_project_status_change();
CREATE TRIGGER trg_notify_on_dispute_change AFTER INSERT OR UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.notify_on_dispute_change();
CREATE TRIGGER trg_notify_on_timelog_approval AFTER UPDATE ON public.time_logs FOR EACH ROW EXECUTE FUNCTION public.notify_on_timelog_approval();
CREATE TRIGGER trg_notify_on_withdrawal_change AFTER UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.notify_on_withdrawal_change();
CREATE TRIGGER trg_notify_on_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();
CREATE TRIGGER trg_notify_on_deliverable_change AFTER INSERT OR UPDATE ON public.project_deliverables FOR EACH ROW EXECUTE FUNCTION public.notify_on_deliverable_change();
CREATE TRIGGER trg_notify_on_service_approval AFTER UPDATE ON public.micro_services FOR EACH ROW EXECUTE FUNCTION public.notify_on_service_approval();
CREATE TRIGGER trg_notify_on_service_purchase AFTER INSERT ON public.escrow_transactions FOR EACH ROW EXECUTE FUNCTION public.notify_on_service_purchase();
CREATE TRIGGER trg_increment_service_sales AFTER INSERT ON public.escrow_transactions FOR EACH ROW EXECUTE FUNCTION public.increment_service_sales();
CREATE TRIGGER trg_generate_ticket_number BEFORE INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();
CREATE TRIGGER trg_generate_request_number BEFORE INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.generate_request_number();
CREATE TRIGGER trg_generate_service_number BEFORE INSERT ON public.micro_services FOR EACH ROW EXECUTE FUNCTION public.generate_service_number();
CREATE TRIGGER trg_generate_dispute_number BEFORE INSERT ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.generate_dispute_number();
CREATE TRIGGER trg_log_dispute_status_change AFTER UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.log_dispute_status_change();
CREATE TRIGGER trg_create_ticket_from_contact AFTER INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.create_ticket_from_contact();
CREATE TRIGGER trg_update_support_ticket_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_support_ticket_updated_at();
CREATE TRIGGER trg_audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER trg_audit_escrow AFTER INSERT OR UPDATE OR DELETE ON public.escrow_transactions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER trg_audit_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Add reviewed_by FK
ALTER TABLE public.bank_transfers ADD CONSTRAINT bank_transfers_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);
