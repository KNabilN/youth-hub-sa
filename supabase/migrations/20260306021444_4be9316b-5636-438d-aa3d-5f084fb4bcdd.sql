
-- Drop ALL duplicate triggers, keeping only one per function per table
-- Pattern: keep trg_* prefixed triggers, drop the duplicates

-- bank_transfers: keep trg_notify_on_bank_transfer_change, drop others
DROP TRIGGER IF EXISTS notify_bank_transfer_change ON public.bank_transfers;
DROP TRIGGER IF EXISTS trg_notify_bank_transfer ON public.bank_transfers;

-- bids: keep trg_notify_on_bid_change, drop duplicate
DROP TRIGGER IF EXISTS trg_notify_bid ON public.bids;

-- contact_messages: keep trg_create_ticket_from_contact, drop duplicate
DROP TRIGGER IF EXISTS on_contact_message_create_ticket ON public.contact_messages;

-- contracts: keep trg_audit_contracts, drop audit_contracts; keep trg_notify_on_contract_change, drop trg_notify_contract
DROP TRIGGER IF EXISTS audit_contracts ON public.contracts;
DROP TRIGGER IF EXISTS trg_notify_contract ON public.contracts;

-- disputes: keep trg_generate_dispute_number, drop set_dispute_number; keep trg_notify_on_dispute_change, drop trg_notify_dispute; keep trg_log_dispute_status_change, drop trigger_dispute_status_log
DROP TRIGGER IF EXISTS set_dispute_number ON public.disputes;
DROP TRIGGER IF EXISTS trg_notify_dispute ON public.disputes;
DROP TRIGGER IF EXISTS trigger_dispute_status_log ON public.disputes;

-- escrow_transactions: keep one audit (trg_audit_escrow), drop audit_escrow + audit_escrow_transactions; keep trg_increment_service_sales, drop on_escrow_increment_sales; keep trg_notify_on_escrow_change, drop trg_notify_escrow; keep trg_notify_on_service_purchase, drop trg_notify_service_purchase
DROP TRIGGER IF EXISTS audit_escrow ON public.escrow_transactions;
DROP TRIGGER IF EXISTS audit_escrow_transactions ON public.escrow_transactions;
DROP TRIGGER IF EXISTS on_escrow_increment_sales ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_notify_escrow ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_notify_service_purchase ON public.escrow_transactions;

-- messages: keep trg_notify_on_new_message, drop trg_notify_new_message
DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;

-- micro_services: keep trg_generate_service_number, drop set_service_number; keep trg_notify_on_service_approval, drop trg_notify_service_approval
DROP TRIGGER IF EXISTS set_service_number ON public.micro_services;
DROP TRIGGER IF EXISTS trg_notify_service_approval ON public.micro_services;

-- profiles: drop duplicate audit
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;

-- projects: drop duplicates
DROP TRIGGER IF EXISTS set_request_number ON public.projects;
DROP TRIGGER IF EXISTS trg_notify_project_status ON public.projects;

-- support_tickets: drop duplicates
DROP TRIGGER IF EXISTS set_ticket_number ON public.support_tickets;
DROP TRIGGER IF EXISTS audit_support_tickets_dup ON public.support_tickets;

-- time_logs: drop duplicate
DROP TRIGGER IF EXISTS trg_notify_timelog ON public.time_logs;

-- withdrawal_requests: drop duplicates
DROP TRIGGER IF EXISTS set_withdrawal_number ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS trg_notify_withdrawal ON public.withdrawal_requests;
