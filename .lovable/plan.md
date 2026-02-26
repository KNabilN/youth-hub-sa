

## Delete the Notifications Page (Remove Duplication)

The `/notifications` page duplicates the admin notifications view. This plan removes the page and updates all references.

### Changes

**1. Delete file:**
- `src/pages/Notifications.tsx`

**2. Edit `src/App.tsx`:**
- Remove the `Notifications` lazy import (line 34)
- Remove the `/notifications` route (line 121)

**3. Edit `src/components/AppSidebar.tsx`:**
- Remove the "الإشعارات" menu item from the "عام" (General) sidebar section (the `SidebarMenuItem` block around lines 147-161)
- Keep the `NotificationBadge` import if it's used elsewhere (e.g., the top bar bell icon)

**4. Update navigation references:**
- `src/components/dashboard/RecentActivity.tsx` (line 64): Change `navigate("/notifications")` to `navigate("/admin/notifications")` so "عرض الكل" still works for admins
- `src/components/DashboardLayout.tsx` (line 38): Change `navigate("/notifications")` to `navigate("/admin/notifications")` so the top-bar bell icon still works

### Files NOT deleted:
- `src/hooks/useNotifications.ts` -- still used by `NotificationBadge`, `RecentActivity`, and realtime subscription logic
- `src/components/notifications/NotificationBadge.tsx` -- still used in the top bar
- `src/components/notifications/NotificationItem.tsx` -- may be used by other components
- `src/pages/admin/AdminNotifications.tsx` -- the admin version stays

