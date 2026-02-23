

# Stage 8: Business Logic Automation and Escrow Workflow

Stages 1-7 built all the UI pages and CRUD operations. However, the platform's core business logic -- the financial workflow that ties contracts, escrow, invoices, and project completion together -- is not yet wired up. This stage closes those critical gaps.

---

## Current State

- Accepting a bid creates a contract and moves the project to `in_progress`
- Both parties can sign contracts, but nothing happens after full signing
- No escrow transactions are ever created
- No invoices are ever generated
- Projects cannot be marked as `completed` by the association
- No automatic notifications are sent on key events (bid accepted, contract signed, etc.)
- The `audit_log` table exists but is never populated

## What Will Be Built

### 1. Escrow Creation on Full Contract Signing
When both `association_signed_at` and `provider_signed_at` are set on a contract, automatically create an `escrow_transaction` with:
- `payer_id` = association, `payee_id` = provider
- `amount` = bid price (from the accepted bid)
- `status` = `held`
- `project_id` = contract's project

This will be done client-side: after either party signs, check if both signatures exist, then create escrow if none exists yet.

### 2. Project Completion Flow
Add a "Mark as Completed" button on `ProjectDetails.tsx` for the association when project status is `in_progress`:
- Updates project status to `completed`
- Releases the escrow (updates `escrow_transactions.status` to `released`)
- Generates an invoice with a unique invoice number, the bid amount, and commission calculated from the active `commission_config` rate

### 3. Automatic Notifications
Insert notifications at key workflow moments (client-side, after successful mutations):
- **Bid accepted**: notify the provider
- **Contract signed**: notify the other party
- **Escrow created**: notify both parties
- **Project completed**: notify the provider
- **Dispute raised**: notify the other party

### 4. Project Cancellation
Add a "Cancel Project" action for the association on `draft` or `open` projects:
- Updates status to `cancelled`
- If escrow exists and is `held`, updates it to `refunded`

### 5. Audit Log Entries
Add audit log entries for critical actions:
- Project status changes
- Contract signing
- Escrow status changes
- Dispute creation/resolution

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useContracts.ts` | After signing, check for full signing and create escrow + notifications |
| `src/hooks/useBids.ts` | Add notification to provider on bid acceptance |
| `src/hooks/useDisputes.ts` | Add notification to other party on dispute creation |
| `src/pages/ProjectDetails.tsx` | Add "Mark as Completed" and "Cancel Project" buttons with escrow release and invoice generation |

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useEscrow.ts` | Escrow creation, release, and refund mutations |
| `src/hooks/useInvoices.ts` | Invoice generation with commission calculation |
| `src/lib/notifications.ts` | Helper to insert notification records for target users |
| `src/lib/audit.ts` | Helper to insert audit log entries |

---

## Technical Details

### Escrow Creation (after full contract signing)
```text
In useContracts.signContract():
  1. Update the contract with the signature timestamp
  2. Re-fetch the contract to check both signatures
  3. If both signed and no escrow exists for this project:
     - Fetch the accepted bid for the project to get the price
     - Insert escrow_transaction(payer_id=association, payee_id=provider, amount=bid.price, status='held', project_id)
     - Insert notification for both parties: "تم إنشاء الضمان المالي للمشروع"
```

### Project Completion (in ProjectDetails)
```text
completeProject(projectId):
  1. Update project status to 'completed'
  2. Fetch escrow where project_id = projectId and status = 'held'
  3. Update escrow status to 'released'
  4. Fetch active commission_config rate
  5. Calculate commission = escrow.amount * rate
  6. Insert invoice(amount=escrow.amount, commission_amount=commission, invoice_number=generated, issued_to=provider, escrow_id)
  7. Insert notification for provider: "تم إتمام المشروع وتحرير المستحقات"
```

### Invoice Number Generation
```text
Format: INV-{YYYYMMDD}-{random 4 digits}
Example: INV-20260223-4827
```

### Notification Helper
```text
sendNotification(userId, message, type) ->
  supabase.from('notifications').insert({ user_id: userId, message, type })
```
Types: `bid_accepted`, `contract_signed`, `escrow_created`, `project_completed`, `dispute_raised`

### Audit Log Helper
```text
logAudit(tableName, recordId, action, oldValues?, newValues?) ->
  supabase.from('audit_log').insert({ table_name: tableName, record_id: recordId, action, actor_id: user.id, old_values, new_values })
```

### Project Cancellation
```text
cancelProject(projectId):
  1. Update project status to 'cancelled'
  2. If escrow exists with status 'held', update to 'refunded'
  3. Insert notification for provider if assigned
```

### No Database Changes
All tables (`escrow_transactions`, `invoices`, `audit_log`, `notifications`) and their columns already exist. No schema modifications needed.

