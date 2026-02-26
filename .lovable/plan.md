

## Delete the Audit Log Page

Remove the "سجل التدقيق" (Audit Log) admin page and all its dedicated references from the app.

### Changes

**1. Delete files:**
- `src/pages/admin/AdminAuditLog.tsx` -- the page component
- `src/hooks/useAuditLog.ts` -- the hook used only by this page

**2. Edit `src/App.tsx`:**
- Remove the `AdminAuditLog` lazy import (line 65)
- Remove the `/admin/audit-log` route (line 147)

**3. Edit `src/components/AppSidebar.tsx`:**
- Remove the sidebar menu item for "سجل التدقيق" (line 64)

### Files NOT deleted (still used elsewhere):
- `src/hooks/useEntityAuditLog.ts` -- used by `EntityActivityLog` component for per-entity activity tracking
- `src/components/admin/EntityActivityLog.tsx` -- used inline in entity detail panels
- `src/lib/audit.ts` -- used across the app to log audit entries

