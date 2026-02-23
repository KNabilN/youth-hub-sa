

# Stage 6: Super Admin Panel

This stage builds the administrative control center for the `super_admin` role, enabling full platform oversight and management. The sidebar already defines 8 admin routes -- this stage implements them all.

---

## What Will Be Built

### 1. User Management (`/admin/users`)
- Table of all users with columns: name, email, role, verification status, join date
- Search and filter by role, verification status
- Actions: verify/unverify user, view profile details
- Requires a new RLS-aware query: admin can read all profiles joined with user_roles

### 2. Projects Overview (`/admin/projects`)
- Table of all projects across all associations
- Filter by status, category, association
- View project details, change project status (e.g., force-cancel a disputed project)
- Link to the existing ProjectDetails page (reuse where possible)

### 3. Services Moderation (`/admin/services`)
- Table of all micro-services with approval status
- Approve/reject pending services
- Filter by approval status, category, provider
- Key admin action: toggle service approval status

### 4. Dispute Management (`/admin/disputes`)
- List of all disputes with status badges (open, under_review, resolved, closed)
- View dispute details: description, project info, parties involved
- Update dispute status and add resolution notes
- Filter by status

### 5. Financial Overview (`/admin/finance`)
- Summary cards: total escrow held, total released, total commissions
- Escrow transactions table with status, amounts, parties
- Invoices list with amounts and commission breakdowns
- Commission config management (view/update active rate)

### 6. Reports Dashboard (`/admin/reports`)
- Platform-wide statistics: total users by role, total projects by status, total services, total donations
- Simple charts using Recharts (already installed): projects by status pie chart, monthly donations bar chart
- Export-ready summary view

### 7. Platform Settings (`/admin/settings`)
- Commission rate configuration (update `commission_config` table)
- Category management: add/edit/delete categories
- Region management: add/edit/delete regions

### 8. Admin Dashboard Enhancement
- Connect the static super_admin dashboard values to live queries:
  - Total users count
  - Total projects count
  - Open disputes count
  - Total platform revenue (sum of commission amounts from invoices)

---

## New Files to Create

```text
src/pages/admin/
  AdminUsers.tsx           -- User management table
  AdminProjects.tsx        -- All projects overview
  AdminServices.tsx        -- Service moderation
  AdminDisputes.tsx        -- Dispute resolution
  AdminFinance.tsx         -- Financial overview
  AdminReports.tsx         -- Platform reports/analytics
  AdminSettings.tsx        -- Platform configuration

src/components/admin/
  UserTable.tsx            -- User list with actions
  DisputeCard.tsx          -- Dispute detail card
  ServiceApprovalCard.tsx  -- Service with approve/reject
  FinanceSummary.tsx       -- Financial summary cards
  CommissionForm.tsx       -- Commission rate editor
  CategoryManager.tsx      -- CRUD for categories
  RegionManager.tsx        -- CRUD for regions

src/hooks/
  useAdminUsers.ts         -- Fetch all users with roles
  useAdminProjects.ts      -- Fetch all projects (admin)
  useAdminServices.ts      -- Fetch all services + approve/reject
  useAdminDisputes.ts      -- Dispute CRUD
  useAdminFinance.ts       -- Escrow + invoices + commission queries
  useAdminStats.ts         -- Dashboard statistics
```

## Routes to Add

| Path | Component | Access |
|------|-----------|--------|
| `/admin/users` | AdminUsers | super_admin |
| `/admin/projects` | AdminProjects | super_admin |
| `/admin/services` | AdminServices | super_admin |
| `/admin/disputes` | AdminDisputes | super_admin |
| `/admin/finance` | AdminFinance | super_admin |
| `/admin/reports` | AdminReports | super_admin |
| `/admin/settings` | AdminSettings | super_admin |

---

## Technical Details

### Data Access Pattern
All admin hooks leverage the existing RLS policies that grant `super_admin` full access (`has_role(auth.uid(), 'super_admin')`). Every table already has an "Admin manage all..." policy.

```text
useAdminUsers()    -> supabase.from('profiles').select('*, user_roles(role)')
useAdminProjects() -> supabase.from('projects').select('*, categories(*), regions(*), profiles!projects_association_id_fkey(full_name)')
useAdminServices() -> supabase.from('micro_services').select('*, categories(*), regions(*), profiles!micro_services_provider_id_fkey(full_name)')
useAdminDisputes() -> supabase.from('disputes').select('*, projects(title), profiles!disputes_raised_by_fkey(full_name)')
useAdminFinance()  -> supabase.from('escrow_transactions').select('*, projects(title), profiles!escrow_transactions_payer_id_fkey(full_name), profiles!escrow_transactions_payee_id_fkey(full_name)')
```

### Profile Visibility for Admin
The `profiles` table RLS has a policy "Admins can view all profiles" that allows super_admin to `SELECT` all rows. Combined with the `user_roles` admin policy, the admin can join profiles with roles.

### Service Moderation Logic
```text
approveService(id) -> supabase.from('micro_services').update({ approval: 'approved' }).eq('id', id)
rejectService(id)  -> supabase.from('micro_services').update({ approval: 'rejected' }).eq('id', id)
```

### Dispute Resolution
```text
updateDispute(id, { status, resolution_notes }) -> supabase.from('disputes').update({ status, resolution_notes }).eq('id', id)
```
Status transitions: open -> under_review -> resolved/closed

### Financial Queries
- Total escrow held: `escrow_transactions` where `status = 'held'`, sum `amount`
- Total released: `escrow_transactions` where `status = 'released'`, sum `amount`
- Total commissions: `invoices`, sum `commission_amount`
- Commission config: `commission_config` where `is_active = true`

### Reports Charts (Recharts)
- Projects by status: PieChart from projects grouped by status
- Users by role: BarChart from user_roles grouped by role
- Monthly donations: BarChart from donor_contributions grouped by month

### Category and Region Management
- CRUD operations on `categories` and `regions` tables
- Admin already has full access via "Admin manage categories" and "Admin manage regions" policies
- Simple inline forms for add/edit with delete confirmation dialogs

### Dashboard Live Data (Admin)
```text
useAdminStats():
  - Total users: count from profiles
  - Total projects: count from projects
  - Open disputes: count from disputes where status = 'open'
  - Revenue: sum of commission_amount from invoices
```

### Route Protection
The `ProtectedRoute` component currently only checks for authentication. Admin routes will additionally check `role === 'super_admin'` and redirect non-admin users to `/dashboard`. A new `AdminRoute` wrapper component will handle this.

### No Database Changes
All required tables, RLS policies, and enums already exist from Stage 2. The admin RLS policies grant full CRUD access to super_admin on every table.

