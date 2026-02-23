

# Stage 11: Missing Features Gap Analysis and Implementation

After comparing the uploaded specification document (منصة الجمعيات الشبابية) with the current codebase, several features are either missing or partially implemented. Below is the full analysis and implementation plan.

---

## Gap Analysis Summary

### Already Implemented (No Changes Needed)
- 4 user roles with role-based routing and sidebar
- Project creation, bidding, contract signing, escrow, and completion workflows
- Micro-services marketplace (fixed price and hourly)
- Time logging and approval by associations
- Donor contributions to projects/services
- Rating system (quality, timing, communication)
- Dispute creation and admin resolution
- Notifications system
- Commission configuration
- Category and region management
- Admin reports with charts (projects by status, users by role, monthly donations)
- Audit log table (exists in DB)
- Profile editing (name, bio)

### Missing or Incomplete Features

| # | Feature (from PDF) | Status | Priority |
|---|---|---|---|
| 1 | **Profile: phone, organization_name, avatar fields** | DB columns exist but Profile page only edits name and bio | High |
| 2 | **Admin: suspend/activate user accounts** | Admin can only toggle verification, no suspend functionality | High |
| 3 | **Admin: edit landing page images/content** | Not implemented (static landing page) | Low |
| 4 | **Admin: export reports as Excel** | Not implemented | Medium |
| 5 | **Admin: audit log viewer** | Table exists but no UI page to view it | Medium |
| 6 | **Marketplace: "Purchase Service" action** | Button exists but does nothing (no purchase flow) | High |
| 7 | **Provider: hourly rate on profile** | No hourly rate field on provider profile | Medium |
| 8 | **Service edit request workflow** | Providers can edit freely; PDF says edits need admin approval with service suspension | Low |
| 9 | **Donor: purchase services directly** | Donors can contribute to projects but cannot buy services directly from marketplace | Medium |
| 10 | **Accessibility features** | No accessibility icon/widget (text zoom, contrast) | Low |
| 11 | **Email notifications** | Only in-app notifications; no email sending | Low |
| 12 | **Admin: proactive intervention before disputes** | No specific UI or workflow | Low |
| 13 | **Time log: stop counting hours on dispute** | No automatic logic for this | Low |
| 14 | **Provider: withdraw earnings** | No withdrawal request feature | Medium |

---

## Implementation Plan (High and Medium Priority Items)

### 1. Enhanced Profile Page
**What:** Add phone, organization_name, and avatar_url fields to the Profile page. These columns already exist in the `profiles` table.

**Changes:**
- `src/pages/Profile.tsx` -- Add Input fields for phone and organization_name, and an avatar upload section
- `src/hooks/useProfile.ts` -- Include phone, organization_name in the update mutation

### 2. Admin: Suspend/Activate User Accounts
**What:** Add a "suspend" toggle for user accounts in the admin user table. Add a `is_suspended` column to profiles.

**Changes:**
- Database migration: Add `is_suspended boolean default false` to `profiles`
- `src/components/admin/UserTable.tsx` -- Add suspend/unsuspend button
- `src/hooks/useAdminUsers.ts` -- Add suspend mutation
- `src/components/ProtectedRoute.tsx` -- Check `is_suspended` and block access

### 3. Admin: Export Reports as Excel
**What:** Add an "Export to Excel" button on the Admin Reports page that downloads user, project, and financial data as a CSV/Excel file.

**Changes:**
- `src/pages/admin/AdminReports.tsx` -- Add export button with CSV generation logic (using built-in browser APIs, no extra library needed)

### 4. Admin: Audit Log Viewer
**What:** Create a new admin page to browse the audit log entries.

**Changes:**
- New file: `src/pages/admin/AdminAuditLog.tsx` -- Table showing audit entries with filters
- New file: `src/hooks/useAuditLog.ts` -- Query hook for audit_log table
- `src/components/AppSidebar.tsx` -- Add "سجل التدقيق" link for super_admin
- `src/App.tsx` -- Add route `/admin/audit-log`

### 5. Marketplace: Service Purchase Flow
**What:** Make the "Purchase Service" button functional. When clicked, create an escrow transaction and notify the provider.

**Changes:**
- `src/components/marketplace/ServiceCard.tsx` -- Add purchase dialog with confirmation
- New file: `src/hooks/usePurchaseService.ts` -- Mutation to create escrow + notification for service purchase
- The association or donor pays, provider receives after delivery

### 6. Provider: Earnings Withdrawal Request
**What:** Add a "Request Withdrawal" feature on the Earnings page.

**Changes:**
- Database migration: Create `withdrawal_requests` table (id, provider_id, amount, status, created_at)
- `src/pages/Earnings.tsx` -- Add withdrawal request button and list
- New file: `src/hooks/useWithdrawals.ts` -- CRUD hooks
- Admin finance page: show pending withdrawals

### 7. Donor: Direct Service Purchase from Marketplace
**What:** Allow donors to see and purchase services from the marketplace, not just contribute to projects.

**Changes:**
- The marketplace is already accessible to all roles
- `src/components/marketplace/ServiceCard.tsx` -- Enable purchase button for donors too, using donor_contributions with service_id

---

## Technical Details

### Database Migrations

```text
Migration 1: Add is_suspended to profiles
  ALTER TABLE public.profiles ADD COLUMN is_suspended boolean NOT NULL DEFAULT false;

Migration 2: Create withdrawal_requests table
  CREATE TABLE public.withdrawal_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL,
    amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz
  );
  ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
  -- Provider sees own requests
  CREATE POLICY "Providers manage own withdrawals" ON public.withdrawal_requests
    FOR ALL USING (provider_id = auth.uid());
  -- Admin manages all
  CREATE POLICY "Admin manage withdrawals" ON public.withdrawal_requests
    FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
```

### Profile Page Enhancement
```text
Add fields:
  - phone (Input, dir="ltr")
  - organization_name (Input, shown for youth_association role)
  - avatar_url (file upload or URL input)
All fields already exist in the profiles table schema.
```

### Excel Export Logic
```text
Convert query data to CSV string using:
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  // BOM prefix for Arabic support in Excel
  download via anchor tag
```

### Service Purchase Flow
```text
1. User clicks "Purchase Service" on ServiceCard
2. Confirmation dialog shows service price and details
3. On confirm:
   a. Create escrow_transaction (payer=current user, payee=provider, service_id, amount=service.price, status='held')
   b. Send notification to provider
4. Provider delivers service, then admin or association confirms release
```

### Files Summary

| Action | File |
|--------|------|
| Modify | `src/pages/Profile.tsx` |
| Modify | `src/hooks/useProfile.ts` |
| Modify | `src/components/admin/UserTable.tsx` |
| Modify | `src/hooks/useAdminUsers.ts` |
| Modify | `src/components/ProtectedRoute.tsx` |
| Modify | `src/pages/admin/AdminReports.tsx` |
| Modify | `src/components/AppSidebar.tsx` |
| Modify | `src/App.tsx` |
| Modify | `src/components/marketplace/ServiceCard.tsx` |
| Modify | `src/pages/Earnings.tsx` |
| Modify | `src/pages/admin/AdminFinance.tsx` |
| Create | `src/pages/admin/AdminAuditLog.tsx` |
| Create | `src/hooks/useAuditLog.ts` |
| Create | `src/hooks/usePurchaseService.ts` |
| Create | `src/hooks/useWithdrawals.ts` |
| Migration | Add `is_suspended` to profiles |
| Migration | Create `withdrawal_requests` table |

