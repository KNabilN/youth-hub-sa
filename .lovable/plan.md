

# Next Steps: Short-term (Important) Fixes

The critical items (audit triggers, password reset, dispute UI, project completion/cancellation, confirmation dialogs, duplicate notification badge) are now done. The next batch focuses on the **short-term important** items from the gap analysis.

---

## Step 1: Admin Support Ticket Management

Currently, support tickets have admin RLS policies but no admin page exists. The admin sidebar has no link to manage tickets.

**Changes:**
- Create `src/pages/admin/AdminTickets.tsx` -- a page listing all tickets with status filters and the ability to update ticket status (open / in_progress / resolved / closed)
- Create `src/hooks/useAdminTickets.ts` -- fetches all tickets (admin RLS already allows it) and provides a mutation to update ticket status
- Add sidebar link "تذاكر الدعم" under the super_admin menu in `AppSidebar.tsx`
- Register the `/admin/tickets` route in `App.tsx` wrapped in `AdminRoute`

---

## Step 2: Admin Role Management

Admins can verify/suspend users but cannot change roles. The `user_roles` table already has an "Admins can manage all roles" RLS policy.

**Changes:**
- Add a role-change dropdown to `UserTable.tsx` with the four roles (youth_association, service_provider, donor, super_admin)
- Create a `useChangeUserRole` mutation in `useAdminUsers.ts` that upserts into `user_roles`

---

## Step 3: Pagination for List Pages

All list pages load every record with no limit, risking the 1000-row cap.

**Changes:**
- Create a reusable `usePaginatedQuery` hook or add pagination state to existing hooks
- Add pagination UI (Previous / Next buttons with page indicator) to key pages:
  - `AdminUsers` (UserTable)
  - `AdminProjects`
  - `Marketplace`
  - `AvailableProjects`
  - `Notifications`
- Each page will fetch 20 records at a time using Supabase `.range(from, to)`

---

## Step 4: Rejected Bid Notification

When a bid is rejected, the provider is not notified. 

**Changes:**
- In the bid rejection logic (inside `useBids.ts` or wherever `useRejectBid` is), add a `sendNotification()` call to the provider after rejection

---

## Technical Details

| Item | Files Modified / Created |
|------|--------------------------|
| Admin Tickets | `src/pages/admin/AdminTickets.tsx` (new), `src/hooks/useAdminTickets.ts` (new), `src/components/AppSidebar.tsx`, `src/App.tsx` |
| Role Management | `src/hooks/useAdminUsers.ts`, `src/components/admin/UserTable.tsx` |
| Pagination | `src/components/ui/Pagination.tsx` (reuse existing), multiple page/hook files |
| Bid Rejection Notification | `src/hooks/useBids.ts` |

