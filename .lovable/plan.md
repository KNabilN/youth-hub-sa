

# Service Provider (مزودي الخدمة) - Feature Analysis and Completion Plan

## Current Workflow Analysis

The service provider has 6 sidebar pages plus shared pages:

| Page | Status | Notes |
|------|--------|-------|
| Dashboard | Done | Shows stats (services, bids, hours, earnings) |
| My Services (خدماتي) | Done | CRUD with image upload, category/region |
| Available Projects (المشاريع المتاحة) | Done | Browse open projects, filter by category/region |
| My Bids (عروضي) | Done | View/filter/withdraw bids, sign contracts |
| Time Tracking (تسجيل الساعات) | Done | Log hours on assigned projects |
| Earnings (الأرباح) | Done | View escrow transactions, request withdrawals |
| Contracts (العقود) | Missing from sidebar | Page exists but not in provider menu |
| Ratings (التقييمات) | Missing from sidebar | Page exists but not in provider menu |
| Disputes | No dedicated page | Only accessible from ProjectDetails |
| Provider Profile | Done | Public profile with services and ratings |

---

## Gaps Identified

### 1. Missing Sidebar Links
The provider menu is missing "العقود" (Contracts) and "التقييمات" (Ratings) links. Both pages already exist and support the provider role, but there's no way to navigate to them from the sidebar.

### 2. No "My Projects" View for Assigned Projects
Once a bid is accepted and contract signed, the provider has no dedicated view of their **active/assigned projects**. They can only see projects via `available-projects` (open ones) or indirectly via `my-bids` (accepted bids). There should be a page showing projects assigned to the provider with links to project details (time logs, disputes, contract status).

### 3. Provider Cannot Access ProjectDetails
The `ProjectDetails` page (`/projects/:id`) is designed for associations. The provider can raise disputes and see time logs there, but the RLS on `projects` only allows the `assigned_provider_id` to SELECT. The provider has no route to view their assigned project's details page -- the sidebar links to `/available-projects/:id` which is the bid submission view, not the full project details.

### 4. No Invoices Page for Provider
When a project is completed, an invoice is generated for the provider. But the provider has no page to view their invoices. The `useInvoices` hook only creates invoices; there is no query hook for fetching them.

### 5. Marketplace Not in Provider Sidebar
The provider cannot browse the services marketplace (to see competitor services or general marketplace). This is optional but could be useful.

### 6. Dashboard Stats Missing "Active Projects" Count
The provider dashboard shows services, bids, hours, and earnings but not the count of actively assigned projects.

---

## Implementation Plan

### Step 1: Add Missing Sidebar Links
**File: `src/components/AppSidebar.tsx`**
- Add "العقود" (`/contracts`) and "التقييمات" (`/ratings`) to the `service_provider` menu array.
- Optionally add "سوق الخدمات" (`/marketplace`) for marketplace browsing.

### Step 2: Create "My Assigned Projects" Page
**New file: `src/pages/MyProjects.tsx`**
- Query `projects` where `assigned_provider_id = user.id` and status in `['in_progress', 'completed', 'disputed']`.
- Display cards with project title, status, budget, and link to project details.
- Include status filter (all, in_progress, completed, disputed).

**New file: `src/hooks/useMyAssignedProjects.ts`**
- Query hook for provider's assigned projects with status filter.

**File: `src/App.tsx`**
- Add route `/my-projects` pointing to the new page.

**File: `src/components/AppSidebar.tsx`**
- Add "مشاريعي" (`/my-projects`) to the provider sidebar menu.

### Step 3: Provider Project Details Access
**File: `src/pages/ProjectDetails.tsx`**
- Add logic so that when the provider is the `assigned_provider_id`, they can view project details (time logs tab, disputes tab, contract tab) but cannot modify project status or manage bids.
- The provider should see their own time logs and be able to raise disputes.
- Hide association-only actions (publish, complete, cancel, approve/reject time logs).

### Step 4: Create Invoices Page for Provider
**New file: `src/pages/Invoices.tsx`**
- Display all invoices where `issued_to = user.id`.
- Show invoice number, amount, commission, date.
- Allow downloading/printing invoice as PDF-like view.

**New file: `src/hooks/useMyInvoices.ts`**
- Query hook for `invoices` where `issued_to = user.id`.

**File: `src/App.tsx`**
- Add route `/invoices`.

**File: `src/components/AppSidebar.tsx`**
- Add "الفواتير" (`/invoices`) under the provider menu.

### Step 5: Enhance Provider Dashboard Stats
**File: `src/hooks/useProviderStats.ts`**
- Add `activeProjects` count: query `projects` where `assigned_provider_id = user.id` and `status = 'in_progress'`.
- Add `pendingWithdrawals` count.

**File: `src/pages/Dashboard.tsx`**
- Update `ProviderDashboard` to show active projects count and pending withdrawal amount.

### Step 6: Provider Disputes Page
**New file: `src/pages/MyDisputes.tsx`**
- Show all disputes the provider is involved in (via projects where `assigned_provider_id = user.id`).
- Each dispute shows status, description, and links to the project.
- Include the `DisputeResponseThread` for responding to disputes.

**New file: `src/hooks/useMyDisputes.ts`**
- Query disputes joined with projects where `assigned_provider_id = user.id` or `raised_by = user.id`.

**File: `src/App.tsx`**
- Add route `/my-disputes`.

**File: `src/components/AppSidebar.tsx`**
- Add "النزاعات" (`/my-disputes`) to provider sidebar.

---

## Updated Provider Sidebar (After Changes)

```
- لوحة التحكم       /dashboard
- خدماتي            /my-services
- المشاريع المتاحة  /available-projects
- مشاريعي           /my-projects        (NEW)
- عروضي             /my-bids
- العقود            /contracts           (existing page, new link)
- تسجيل الساعات     /time-tracking
- الأرباح           /earnings
- الفواتير          /invoices            (NEW)
- التقييمات         /ratings             (existing page, new link)
- النزاعات          /my-disputes         (NEW)
```

## Technical Summary

| Item | New Files | Modified Files |
|------|-----------|---------------|
| Sidebar links | -- | AppSidebar.tsx |
| My Assigned Projects | MyProjects.tsx, useMyAssignedProjects.ts | App.tsx, AppSidebar.tsx |
| Provider project access | -- | ProjectDetails.tsx |
| Invoices page | Invoices.tsx, useMyInvoices.ts | App.tsx, AppSidebar.tsx |
| Dashboard stats | -- | useProviderStats.ts, Dashboard.tsx |
| Disputes page | MyDisputes.tsx, useMyDisputes.ts | App.tsx, AppSidebar.tsx |

**Total: 6 new files, 5 modified files. No database migrations needed** (all necessary tables and RLS policies already exist).

