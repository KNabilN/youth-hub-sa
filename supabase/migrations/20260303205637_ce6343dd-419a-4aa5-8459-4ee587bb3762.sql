
-- Create escrow transactions for associations (pending_payment)
INSERT INTO escrow_transactions (payer_id, payee_id, service_id, amount, status, beneficiary_id)
VALUES
  -- Association: منصور رميض العنزي buying service from provider
  ('0143af4f-36e3-4d0a-8ccc-2527bd7dc60b', '770d9527-e0c3-4317-9ad9-d276e95860f2', 'b42b0119-4004-4bf5-9438-6fa236c48cfc', 3000, 'pending_payment', NULL),
  -- Association: واصل بن محمد القرشي buying service
  ('0646c494-1a1d-4ac6-96d7-3b9f8ae337e2', '8d8bbe0f-9d1d-4d6d-a6d6-4e14228a5b41', 'ac069993-281a-4aa1-8379-806c4a323469', 200, 'pending_payment', NULL);

-- Now insert bank_transfers linked to the new escrow transactions
INSERT INTO bank_transfers (escrow_id, user_id, receipt_url, amount, status)
SELECT et.id, et.payer_id, et.payer_id || '/sample_receipt_' || substr(et.id::text, 1, 8) || '.pdf', et.amount, 'pending'
FROM escrow_transactions et
WHERE et.payer_id IN ('0143af4f-36e3-4d0a-8ccc-2527bd7dc60b', '0646c494-1a1d-4ac6-96d7-3b9f8ae337e2')
  AND et.status = 'pending_payment'
  AND NOT EXISTS (SELECT 1 FROM bank_transfers bt WHERE bt.escrow_id = et.id);
