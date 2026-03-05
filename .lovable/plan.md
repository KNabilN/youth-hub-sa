

# Full Website Review: Findings and Remediation Plan

## 1. Database Connection Issues

### 1a. Duplicate notification insertion on escrow release/refund
**Location:** `src/pages/admin/AdminFinance.tsx` (line 178) AND database trigger `notify_on_escrow_change`
**Problem:** When admin releases or refunds escrow with receipt, the code manually inserts a notification (line 178), but the database trigger `notify_on_escrow_change` ALSO fires on status change, creating **duplicate notifications** for the same event.
**Fix:** Remove the manual notification insert from `handleEscrowWithReceipt` — the trigger already covers it.

### 1b. Escrow foreign key aliases may fail
**Location:** `src/hooks/useAdminFinance.ts` (line 13)
**Problem:** The query uses `profiles!escrow_transactions_payer_id_fkey` and `profiles!escrow_transactions_payee_id_fkey`, but if no actual foreign keys exist on `escrow_transactions` (the schema shows no FK entries), these aliases will fail silently or error. Need to verify the query works, or switch to using subqueries/separate fetches.
**Fix:** Verify FK names match actual constraints, or use explicit `payer:profiles!payer_id(full_name)` syntax.

### 1c. `useReleaseEscrow` duplicates with admin flow
**Location:** `src/hooks/useEscrow.ts` (line 43) vs `AdminFinance.tsx` (line 141)
**Problem:** The association's "Complete Project" flow in `ProjectDetails.tsx` uses `useReleaseEscrow` which updates escrow to "released" directly, but the new admin flow requires a receipt. The association completing a project bypasses the receipt requirement.
**Status:** This is by design per memory — associations complete → auto-release. But the invoice generated via `useGenerateInvoice` (ProjectDetails) and the invoice from `handleEscrowWithReceipt` (AdminFinance) have different formats/logic, which could cause inconsistency.
**Fix:** Unify invoice generation logic into a shared utility.

### 1d. `donor_purchases` page references missing data
**Location:** `src/hooks/useDonorPurchases.ts` returns `data as any[]`
**Problem:** Heavy use of `as any` casts throughout hooks (found in 30 files) bypasses type safety. While functional, this masks potential runtime errors when database schema changes.

---

## 2. UI/UX Consistency Issues

### 2a. Donor sidebar missing common items
**Location:** `src/components/AppSidebar.tsx` (lines 57-64)
**Problem:** The donor role menu doesn't include "سوق الخدمات" (Marketplace), "سلة المشتريات" (Cart), or "مشتريات المانح" (Donor Purchases) which are routes that exist and are accessible. Donors can buy services but can't navigate to them from the sidebar.
**Fix:** Add Marketplace, Cart, and Donor Purchases to the donor sidebar menu.

### 2b. Donor missing Invoices page access
**Location:** Same sidebar config
**Problem:** Donors can receive invoices (from escrow release/refund) but have no "Invoices" link in their sidebar.
**Fix:** Add Invoices link to donor menu.

### 2c. Missing notifications link for donors
**Location:** `AppSidebar.tsx` — the `isNonAdmin` block (line 278+) includes notifications for non-admin roles, which includes donors. This is correct. But donors don't have a Messages link while they could have project-related messages if they funded projects.

### 2d. Page header pattern inconsistency
**Problem:** Most pages use the unified header pattern (icon + title + subtitle + gradient divider), but `Earnings.tsx` uses a slightly different layout with `justify-between` instead of the standard pattern.
**Fix:** Minor — standardize the Earnings page header to match the unified pattern.

---

## 3. Functional Issues

### 3a. `PaymentCallback` session loss after 3DS redirect
**Location:** `src/pages/PaymentCallback.tsx` (lines 41-51)
**Problem:** After 3DS redirect, the code retries `getSession()` 10 times with 500ms delay (5 seconds total). If the user's refresh token is expired (as seen in console logs: `refresh_token_not_found`), all retries fail. The user sees "session expired" but their payment was already captured by Moyasar.
**Fix:** Add a fallback that calls `moyasar-verify-payment` with service_role key (server-side) when session is lost, or persist payment context more durably (e.g., URL params instead of sessionStorage which may be cleared on redirect).

### 3b. `sessionStorage` for payment context is fragile
**Location:** `Checkout.tsx` and `Donations.tsx` save to `sessionStorage`; `PaymentCallback.tsx` reads from it.
**Problem:** Some browsers clear `sessionStorage` on cross-origin redirects (3DS flow goes to bank's domain). If cleared, `paymentContext` will be `{}`, and the verify call will have no context to process the payment.
**Fix:** Encode critical context in the `callback_url` as URL parameters, not sessionStorage.

### 3c. Escrow created without project assignment check
**Location:** `useSignContract` (line 92-98)
**Problem:** When both parties sign and no existing escrow, it creates an escrow using the accepted bid price. But if no accepted bid exists (`bid` is null), no escrow is created and no error is shown — the contract appears fully signed but project won't start properly.
**Fix:** Add error handling when no accepted bid is found after both signatures.

### 3d. Cart accessible without login
**Location:** `App.tsx` line 167: `<Route path="/cart" element={<SuspenseWrap><Cart /></SuspenseWrap>} />`
**Problem:** The Cart page is not wrapped in `ProtectedRoute`, meaning unauthenticated users can access it. While the `useCartItems` hook requires auth, the page loads without protection.
**Status:** This may be intentional for guest cart functionality (`useGuestCart` hook exists), so it's a design choice rather than a bug.

---

## 4. User Flow Gaps

### 4a. No escrow creation button visible after contract signing (bank transfer flow)
**Location:** `ProjectDetails.tsx` escrow section
**Problem:** For the standard flow (non-bank-transfer), when both parties sign the contract, escrow is auto-created from the bid price. But the "Create Escrow" button is shown for associations when `project.status === "in_progress" && !escrow`. If the auto-creation in `useSignContract` fails silently, the user has no feedback.

### 4b. Provider can't view receipt on released escrow
**Location:** Provider sees escrow status in `ProjectDetails.tsx` but there's no link to view the admin-uploaded receipt from the `escrow-receipts` bucket.

### 4c. Incomplete invoice PDF download on user side
**Location:** `src/pages/Invoices.tsx` — need to verify the PDF generation works with the current invoice data structure, especially for the new escrow-generated invoices from AdminFinance.

---

## Recommended Priority Order

1. **Fix duplicate notifications** on escrow release/refund (quick, high impact)
2. **Add missing donor sidebar items** (Marketplace, Cart, Purchases, Invoices)
3. **Fix sessionStorage fragility** for payment callback context
4. **Unify invoice generation** between association flow and admin flow
5. **Add error handling** for missing bid in contract signing flow
6. **Standardize Earnings page header** to unified pattern

