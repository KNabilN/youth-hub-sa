
CREATE OR REPLACE FUNCTION public.cascade_permanent_delete(p_table text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete child records based on parent table
  IF p_table = 'projects' THEN
    DELETE FROM bid_comments WHERE bid_id IN (SELECT id FROM bids WHERE project_id = p_id);
    DELETE FROM bids WHERE project_id = p_id;
    DELETE FROM messages WHERE project_id = p_id;
    DELETE FROM contract_versions WHERE contract_id IN (SELECT id FROM contracts WHERE project_id = p_id);
    DELETE FROM contracts WHERE project_id = p_id;
    DELETE FROM project_deliverables WHERE project_id = p_id;
    DELETE FROM time_logs WHERE project_id = p_id;
    DELETE FROM dispute_responses WHERE dispute_id IN (SELECT id FROM disputes WHERE project_id = p_id);
    DELETE FROM dispute_status_log WHERE dispute_id IN (SELECT id FROM disputes WHERE project_id = p_id);
    DELETE FROM disputes WHERE project_id = p_id;
    DELETE FROM escrow_transactions WHERE project_id = p_id;
    DELETE FROM attachments WHERE entity_type = 'project' AND entity_id = p_id;
    DELETE FROM notifications WHERE entity_type = 'project' AND entity_id = p_id;
    DELETE FROM donor_contributions WHERE project_id = p_id;
    DELETE FROM grant_requests WHERE project_id = p_id;
    DELETE FROM impact_reports WHERE project_id = p_id;
    DELETE FROM projects WHERE id = p_id;

  ELSIF p_table = 'micro_services' THEN
    DELETE FROM cart_items WHERE service_id = p_id;
    DELETE FROM escrow_transactions WHERE service_id = p_id;
    DELETE FROM donor_contributions WHERE service_id = p_id;
    DELETE FROM attachments WHERE entity_type = 'service' AND entity_id = p_id;
    DELETE FROM notifications WHERE entity_type = 'service' AND entity_id = p_id;
    DELETE FROM micro_services WHERE id = p_id;

  ELSIF p_table = 'contracts' THEN
    DELETE FROM contract_versions WHERE contract_id = p_id;
    DELETE FROM ratings WHERE contract_id = p_id;
    DELETE FROM attachments WHERE entity_type = 'contract' AND entity_id = p_id;
    DELETE FROM contracts WHERE id = p_id;

  ELSIF p_table = 'bids' THEN
    DELETE FROM bid_comments WHERE bid_id = p_id;
    DELETE FROM attachments WHERE entity_type = 'bid' AND entity_id = p_id;
    DELETE FROM bids WHERE id = p_id;

  ELSIF p_table = 'disputes' THEN
    DELETE FROM dispute_responses WHERE dispute_id = p_id;
    DELETE FROM dispute_status_log WHERE dispute_id = p_id;
    DELETE FROM attachments WHERE entity_type = 'dispute' AND entity_id = p_id;
    DELETE FROM disputes WHERE id = p_id;

  ELSIF p_table = 'support_tickets' THEN
    DELETE FROM ticket_replies WHERE ticket_id = p_id;
    DELETE FROM attachments WHERE entity_type = 'ticket' AND entity_id = p_id;
    DELETE FROM support_tickets WHERE id = p_id;

  ELSIF p_table = 'invoices' THEN
    DELETE FROM invoices WHERE id = p_id;

  ELSIF p_table = 'portfolio_items' THEN
    DELETE FROM portfolio_items WHERE id = p_id;

  ELSIF p_table = 'ratings' THEN
    DELETE FROM ratings WHERE id = p_id;

  ELSIF p_table = 'profiles' THEN
    -- Profiles have many dependencies, delete carefully
    DELETE FROM notifications WHERE user_id = p_id;
    DELETE FROM cart_items WHERE user_id = p_id;
    DELETE FROM profile_saves WHERE user_id = p_id OR profile_id = p_id;
    DELETE FROM attachments WHERE user_id = p_id;
    DELETE FROM portfolio_items WHERE provider_id = p_id;
    DELETE FROM audit_log WHERE actor_id = p_id;
    DELETE FROM user_roles WHERE user_id = p_id;
    DELETE FROM profiles WHERE id = p_id;

  ELSE
    RAISE EXCEPTION 'Unsupported table: %', p_table;
  END IF;
END;
$$;
