

# Admin Edit Requests System

## Overview
Build a system where admins can request changes to services, projects, and profiles. Instead of directly editing, the admin creates an "edit request" that gets sent as a notification to the item's owner. The owner can then accept (apply the changes) or reject it. If rejected, the item enters a pending/frozen status until the admin re-approves.

## Database Changes

### New Table: `edit_requests`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| target_table | text | 'micro_services', 'projects', or 'profiles' |
| target_id | uuid | ID of the record to edit |
| requested_by | uuid | Admin user ID |
| target_user_id | uuid | Owner of the item (receives the request) |
| requested_changes | jsonb | Key-value pairs of proposed field changes |
| message | text | Optional admin message explaining why |
| status | text | 'pending', 'accepted', 'rejected' (default: 'pending') |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

### RLS Policies for `edit_requests`
- Admins can do everything (ALL)
- Target users can SELECT and UPDATE their own requests (to accept/reject)

### Realtime
- Enable realtime on `edit_requests` so users see new requests immediately

## Application Changes

### 1. Hook: `src/hooks/useEditRequests.ts`
- `useCreateEditRequest()` - Admin creates a request with target_table, target_id, target_user_id, requested_changes, message
- `useMyEditRequests()` - User fetches their pending edit requests
- `useAcceptEditRequest()` - User accepts: applies the changes to the target table, updates status to 'accepted'
- `useRejectEditRequest()` - User rejects: updates status to 'rejected', sets the target item to pending status (approval='pending' for services, status='pending_approval' for projects)

### 2. Admin UI - "Request Edit" Button

**ServiceApprovalCard** (`src/components/admin/ServiceApprovalCard.tsx`):
- Add a "طلب تعديل" (Request Edit) button
- Opens a dialog with editable fields (title, description, price) pre-filled with current values
- Admin modifies the fields they want changed, adds an optional message
- Submits as an edit request + sends notification to provider

**AdminProjects** (`src/pages/admin/AdminProjects.tsx`):
- Add a "طلب تعديل" button per project row
- Dialog with editable fields (title, description, budget)
- Submits edit request + notification to association

**UserTable** (`src/components/admin/UserTable.tsx`):
- Change the existing direct-edit pencil button to create an edit request instead
- Same dialog fields, but now submits as a request rather than direct update

### 3. New Component: `src/components/admin/EditRequestDialog.tsx`
- Reusable dialog component for creating edit requests
- Props: fields config, current values, target info
- Renders form fields dynamically based on config
- Submits via `useCreateEditRequest`

### 4. User-Facing: Edit Requests Page (`src/pages/EditRequests.tsx`)
- New page at `/edit-requests` route
- Shows pending edit requests for the logged-in user
- Each request shows: which item, what changes are proposed, admin message
- Accept/Reject buttons per request
- On accept: changes are applied to the item automatically
- On reject: item status set to pending, notification sent to admin

### 5. New Component: `src/components/edit-requests/EditRequestCard.tsx`
- Card showing the edit request details
- Side-by-side comparison of current vs proposed values
- Accept/Reject action buttons

### 6. Navigation
- Add "طلبات التعديل" link to the sidebar for non-admin users
- Show badge count of pending edit requests

### 7. Notifications
- When admin creates request: notify user "لديك طلب تعديل من المدير على [نوع العنصر]"
- When user accepts: notify admin "تم قبول طلب التعديل على [عنصر]"
- When user rejects: notify admin "تم رفض طلب التعديل على [عنصر] - تم تعليقه"

## Flow Summary

```text
Admin views service/project/profile
  |
  v
Clicks "Request Edit" button
  |
  v
Dialog opens with current values pre-filled
Admin modifies desired fields + adds message
  |
  v
Edit request created in DB + notification sent to owner
  |
  v
Owner sees notification + visits Edit Requests page
  |
  +---> Accepts: changes applied to item, admin notified
  |
  +---> Rejects: item set to pending status, admin notified
              Admin must re-approve the item
```

## Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Create `edit_requests` table + RLS + realtime |
| `src/hooks/useEditRequests.ts` | New - CRUD hooks |
| `src/components/admin/EditRequestDialog.tsx` | New - reusable dialog |
| `src/components/edit-requests/EditRequestCard.tsx` | New - user-facing card |
| `src/pages/EditRequests.tsx` | New - user page |
| `src/components/admin/ServiceApprovalCard.tsx` | Add request edit button |
| `src/pages/admin/AdminProjects.tsx` | Add request edit button |
| `src/components/admin/UserTable.tsx` | Change direct edit to request |
| `src/components/AppSidebar.tsx` | Add edit requests nav link |
| `src/App.tsx` | Add `/edit-requests` route |

Total: 5 new files, 5 modified files, 1 database migration.

