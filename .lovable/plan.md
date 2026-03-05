

## Plan: Escrow Release/Refund with Receipt Upload and Auto-Invoice

### Current behavior
Clicking "تحرير" or "استرداد" on escrow rows directly updates the status without any receipt or invoice.

### Proposed changes

**File: `src/pages/admin/AdminFinance.tsx`**

1. **New state variables** for escrow receipt dialog:
   - `escrowActionDialog` — tracks `{id, action: "released"|"refunded", escrow}` or null
   - `escrowReceiptFile` — the uploaded receipt file
   - `escrowUploading` — loading state

2. **Replace direct `handleEscrowStatus` calls** for "released" and "refunded" buttons to open a dialog instead (similar to withdrawal approve pattern)

3. **New handler `handleEscrowWithReceipt`**:
   - Upload receipt to `escrow-receipts` storage bucket (bucket needs to be created)
   - Update escrow status to released/refunded
   - Fetch commission rate from `commission_config`
   - Generate invoice number and insert into `invoices` table:
     - For **released**: `issued_to` = `payee_id` (provider gets the invoice)
     - For **refunded**: `issued_to` = `payer_id` (payer gets the refund invoice)
   - Notify the recipient via `notifications` table
   - Invalidate relevant queries

4. **New Dialog** at the bottom (reusing same pattern as withdrawal approve dialog):
   - Title changes based on action: "إرفاق إيصال التحرير" / "إرفاق إيصال الاسترداد"
   - File upload input (PDF/image)
   - Confirm button

5. **Display receipt link** on completed escrow rows (released/refunded) — replace the "مكتمل" text with a receipt view button if receipt exists

**Database migration needed:**
- Add `receipt_url` column to `escrow_transactions` table (text, nullable)
- Create `escrow-receipts` storage bucket

### No changes needed to:
- Invoice display pages (existing queries already show all invoices)
- `useGenerateInvoice` hook (invoice creation happens inline in this page)

