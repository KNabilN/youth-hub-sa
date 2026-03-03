

## Review: Project Hour Calculations Cycle

### Current Flow

The time tracking cycle involves three actors: **Provider**, **Association**, and **Admin**.

```text
Provider                    Association                 Admin
────────                    ───────────                 ─────
1. Logs hours               3. Reviews time logs        (full access)
   (WorkTimer or manual)       (approve/reject)
2. Sees own logs            4. Sees summary stats
   with approval status        (pending/approved hours)
```

**What exists today:**
- Provider logs hours via `/time-tracking` (manual form + WorkTimer)
- Association reviews/approves/rejects via `/time-logs`
- Admin has full DB access via RLS
- DB trigger `notify_on_timelog_approval` notifies provider on approve/reject
- Projects have `estimated_hours` field but it is **never compared** against actual logged hours

### Issues Found

1. **No hours vs estimate comparison** -- `estimated_hours` on a project is never compared to total logged/approved hours. No warning when hours exceed the estimate.
2. **No time logs tab in AdminProjectDetail** -- The admin project detail page has tabs for bids, contract, and activity, but no tab showing time logs for that project.
3. **No time logs summary on ProjectDetails (association side)** -- The association's project detail page doesn't show logged hours progress.
4. **No pagination** on time logs list (both provider and association views).
5. **WorkTimer state lost on page reload** -- Timer runs in component state only; navigating away loses it.
6. **No duplicate entry guard** -- A provider can log the same date/project/hours multiple times.
7. **No weekly/monthly summary** for the provider.
8. **Association TimeLogs page has no project filter** -- Can only filter by approval status, not by specific project.

### Enhancement Plan

#### 1. Add hours progress tracking on projects
- In `AdminProjectDetail.tsx` and `ProjectDetails.tsx`, fetch total approved hours from `time_logs` for the project and display a progress bar comparing against `estimated_hours`.
- Show a warning badge when approved hours exceed 80% or 100% of the estimate.

#### 2. Add Time Logs tab to AdminProjectDetail
- Add a "سجل الساعات" tab in the existing `Tabs` component on `AdminProjectDetail.tsx`.
- Fetch and display time logs for that specific project using the existing `TimeLogTable` component.
- Include approve/reject actions for the admin.

#### 3. Add project filter to Association TimeLogs page
- In `TimeLogs.tsx`, add a `Select` dropdown to filter by project (fetched from the association's projects).
- Pass the filter to `useAssociationTimeLogs`.

#### 4. Add hours summary to Association ProjectDetails
- On the association's `ProjectDetails.tsx` page, show a card with total logged hours, approved hours, and progress vs estimated hours.

#### 5. Prevent duplicate time entries (optional DB constraint)
- Add a unique constraint or validation trigger on `(provider_id, project_id, log_date)` to prevent logging multiple entries for the same project on the same day (or at minimum warn the user).

### Files to Modify
- `src/pages/admin/AdminProjectDetail.tsx` -- Add time logs tab + hours progress
- `src/pages/ProjectDetails.tsx` -- Add hours summary card
- `src/pages/TimeLogs.tsx` -- Add project filter dropdown
- `src/hooks/useTimeLogs.ts` -- Accept optional `projectId` filter
- No database migration needed (all data already exists)

