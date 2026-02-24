

# User Detail Panel in Admin Users Page

## Overview
When the admin clicks on a user's name in the users table, a side panel (Sheet) will slide open showing all of that user's data organized in tabs: profile info, services, projects, contracts, disputes, time logs, and edit requests.

## Implementation

### 1. New Component: `src/components/admin/UserDetailSheet.tsx`

A Sheet component that slides in from the left (RTL layout) containing:

**Header**: Avatar, name, role badge, verification/suspension status

**Tabbed Content** with the following tabs:

| Tab | Data Source | What it Shows |
|-----|------------|---------------|
| الملف الشخصي (Profile) | `profiles` table | Full name, phone, org name, bio, hourly rate, email (from user_roles join), join date, verification, suspension status |
| الخدمات (Services) | `micro_services` where `provider_id = userId` | All services with title, price, approval status, category |
| المشاريع (Projects) | `projects` where `association_id = userId` OR `assigned_provider_id = userId` | Projects with title, status, budget, category |
| العقود (Contracts) | `contracts` where `provider_id` or `association_id = userId` | Contract list with project info, signing status |
| النزاعات (Disputes) | `disputes` where `raised_by = userId` | Disputes with status, description |
| سجل الوقت (Time Logs) | `time_logs` where `provider_id = userId` | Time entries with hours, date, project, approval |
| طلبات التعديل (Edit Requests) | `edit_requests` where `target_user_id = userId` | Pending/past edit requests |

Each tab will query via the admin's RLS privileges (admin has ALL on these tables).

### 2. New Hook: `src/hooks/useAdminUserDetails.ts`

Contains individual query hooks for each data type, all taking a `userId` parameter:
- `useAdminUserServices(userId)` - fetches from `micro_services` with category join
- `useAdminUserProjects(userId)` - fetches from `projects` with category/region joins
- `useAdminUserContracts(userId)` - fetches from `contracts` with project title join
- `useAdminUserDisputes(userId)` - fetches from `disputes` with project title join
- `useAdminUserTimeLogs(userId)` - fetches from `time_logs` with project title join
- `useAdminUserEditRequests(userId)` - fetches from `edit_requests`

All queries are enabled only when `userId` is provided.

### 3. Modify: `src/components/admin/UserTable.tsx`

- Add state: `const [viewUser, setViewUser] = useState<any>(null);`
- Make the user's name in the table a clickable element (styled as a link/button)
- On click, set `viewUser` to the user object
- Render `<UserDetailSheet>` at the bottom of the component

### No Database Changes Required
The admin already has ALL policies on every relevant table, so all queries will work with existing RLS.

## Technical Details

### UserDetailSheet Component Structure
- Uses `Sheet` from `@/components/ui/sheet` with `side="left"` (since the app is RTL, left side acts as the detail panel)
- Sheet width: `sm:max-w-2xl w-[90%]` for enough room to display data
- Uses `Tabs` component for organized navigation between data sections
- Each tab content uses `ScrollArea` for scrollable content within the sheet
- Loading states with `Skeleton` per tab
- Empty states with helpful messages per tab

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useAdminUserDetails.ts` | Query hooks for user-related data |
| `src/components/admin/UserDetailSheet.tsx` | Sheet component with tabs |

### Files to Modify
| File | Change |
|------|--------|
| `src/components/admin/UserTable.tsx` | Make name clickable, add Sheet state and render |

