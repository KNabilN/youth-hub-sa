
-- Prevent duplicate active (non-final) escrows for the same project
CREATE UNIQUE INDEX unique_active_project_escrow 
  ON escrow_transactions(project_id) 
  WHERE project_id IS NOT NULL AND status IN ('held', 'pending_payment');
