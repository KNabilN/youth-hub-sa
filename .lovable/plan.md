

# Implementing Remaining Gaps

This plan covers all items listed in the remaining gaps document, organized into logical batches.

---

## Batch 1: Service Image Upload

**Database**: Add `image_url TEXT` column to `micro_services` table.

**Storage**: Create a `service-images` public storage bucket with RLS policies allowing providers to upload images for their own services.

**Code Changes**:
- **`src/components/services/ServiceForm.tsx`** -- Add an image upload field (file input with preview). On file select, upload to `service-images` bucket and store the URL.
- **`src/hooks/useMyServices.ts`** -- Pass `image_url` through create/update mutations.
- **`src/components/marketplace/ServiceCard.tsx`** -- Display the service image if available (above the card content).
- **`src/components/services/MyServiceCard.tsx`** -- Show a thumbnail of the service image.
- **`src/components/admin/ServiceApprovalCard.tsx`** -- Show the service image in the admin review card.

---

## Batch 2: Donor Service Purchase Flow

Currently donors can donate to projects/services but cannot directly purchase a service (which creates an escrow transaction). The `ServiceCard` already allows `donor` role to purchase, but the `usePurchaseService` hook only creates escrow -- it should also create a `donor_contributions` record.

**Code Changes**:
- **`src/hooks/usePurchaseService.ts`** -- After creating the escrow, also insert a `donor_contributions` record with `service_id` and `amount` when the buyer is a donor.
- **`src/components/marketplace/ServiceCard.tsx`** -- Already allows donors to purchase. No change needed.

---

## Batch 3: Admin Edit User Profiles

**Database**: Add an RLS UPDATE policy on `profiles` for super_admin: `has_role(auth.uid(), 'super_admin')`.

**Code Changes**:
- **`src/hooks/useAdminUsers.ts`** -- Add `useAdminUpdateProfile` mutation that updates a profile by user ID.
- **`src/components/admin/UserTable.tsx`** -- Add an "Edit" button on each row that opens a dialog with editable fields (full_name, phone, organization_name, bio, hourly_rate). Save calls the new mutation.

---

## Batch 4: Comprehensive CSV/Excel Export

**Code Changes**:
- **`src/pages/admin/AdminReports.tsx`** -- Replace the single "export users" button with a dropdown offering multiple export types:
  - Export Users (existing)
  - Export Projects (id, title, status, budget, region, category, created_at)
  - Export Services (title, provider, price, category, approval, created_at)
  - Export Financial (escrow transactions: amount, status, payer, payee, created_at)
  - Export Invoices (invoice_number, amount, commission_amount, issued_to, created_at)

Each option fetches the relevant data and generates a UTF-8 BOM CSV file.

---

## Batch 5: Admin Delete/Suspend Individual Services

**Code Changes**:
- **`src/hooks/useAdminServices.ts`** -- Add `useDeleteService` mutation (admin deletes a service by ID).
- **`src/components/admin/ServiceApprovalCard.tsx`** -- Add a "Delete" button with confirmation dialog next to approve/reject buttons.

---

## Batch 6: Missing Notifications

Add notification triggers for events currently missing:

- **Service published (approved)**: In `src/hooks/useAdminServices.ts` `useUpdateServiceApproval` -- after approving, notify the provider.
- **Service purchased**: Already done in `usePurchaseService` (provider is notified). Also notify the buyer for confirmation.
- **Hour approval**: In the time log approval logic, notify the provider when their hours are approved/rejected.

**Code Changes**:
- **`src/hooks/useAdminServices.ts`** -- After approval mutation succeeds, send notification to the service's `provider_id`.
- **`src/hooks/usePurchaseService.ts`** -- Also notify the buyer on successful purchase.
- **`src/hooks/useTimeLogs.ts`** -- In the approval mutation, notify the provider.

---

## Batch 7: Donor Fund Tracking

**Code Changes**:
- **`src/pages/ImpactReports.tsx`** -- Enhance with a "Fund Consumption" section. For each contribution linked to a project, show the project status (draft/open/in_progress/completed) as a proxy for fund usage. Add a summary card showing "Funds in active projects" vs "Funds in completed projects".
- **`src/hooks/useDonorStats.ts`** -- Add queries for fund consumption breakdown.

---

## Batch 8: Dark Mode Toggle

The `next-themes` package is already installed.

**Code Changes**:
- **`src/main.tsx`** or **`src/App.tsx`** -- Wrap the app with `ThemeProvider` from `next-themes`.
- **`src/components/AppSidebar.tsx`** -- Add a dark/light mode toggle button in the sidebar footer (moon/sun icon), using `useTheme()` from `next-themes`.
- **`index.html`** -- Ensure `<html>` tag supports `class` attribute for dark mode (Tailwind dark mode).
- **`tailwind.config.ts`** -- Add `darkMode: "class"` if not present.

---

## Batch 9: Detailed Analytics Enhancements

**Code Changes**:
- **`src/pages/admin/AdminReports.tsx`** -- Add:
  - Average hourly rate chart (query `profiles` where `hourly_rate IS NOT NULL`, compute average and distribution)
  - Monthly escrow/commission breakdown (query `escrow_transactions` grouped by month)
  - Donor analytics section (total donors count, total grants, grants by project)

---

## Technical Summary

| Batch | Database Migration | Files Created | Files Modified |
|-------|-------------------|---------------|----------------|
| 1. Service Images | Add column + storage bucket | -- | ServiceForm, ServiceCard, MyServiceCard, ServiceApprovalCard, useMyServices |
| 2. Donor Purchase | -- | -- | usePurchaseService |
| 3. Admin Edit Users | Add RLS policy | -- | useAdminUsers, UserTable |
| 4. CSV Export | -- | -- | AdminReports |
| 5. Admin Delete Services | -- | -- | useAdminServices, ServiceApprovalCard |
| 6. Missing Notifications | -- | -- | useAdminServices, usePurchaseService, useTimeLogs |
| 7. Donor Fund Tracking | -- | -- | ImpactReports, useDonorStats |
| 8. Dark Mode | -- | -- | App.tsx, AppSidebar, tailwind.config, index.html |
| 9. Analytics | -- | -- | AdminReports |

**Total: 1 migration (service images + admin profile RLS), ~15 files modified**

