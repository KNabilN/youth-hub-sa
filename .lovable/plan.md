

# Stage 9: Polish, UX Refinements, and Dashboard Activity Feed

With all core features and business logic complete (Stages 1-8), this final stage focuses on polishing the user experience, filling small UI gaps, and making the dashboard more useful with real activity data.

---

## What Will Be Built

### 1. Dashboard "Recent Activity" Feed
Currently the dashboard shows a static "No activity yet" card for all roles. Replace this with a real activity feed:
- **Associations**: Show recent bids received, contracts signed, project status changes
- **Providers**: Show recent bid responses, contract events, escrow updates
- **Donors**: Show recent donations and funded project updates
- **Admins**: Show recent disputes, new users, and escrow movements

Data source: pull from `notifications` table for the current user, showing the latest 5-10 items with timestamps and icons.

### 2. Empty State Improvements
Several pages show plain text when empty. Add structured empty states with icons and call-to-action buttons:
- Projects page: "Create your first project" button
- My Services: "Add a service" button
- My Bids: "Browse available projects" link
- Earnings: descriptive empty state

### 3. Loading Skeletons Consistency
Some pages use `Skeleton` components, others show plain text "Loading...". Standardize all pages to use skeleton placeholders for a consistent feel.

### 4. Responsive RTL Fixes
- Ensure all grid layouts collapse properly on mobile
- Fix any icon/text spacing issues in RTL mode (margin-left vs margin-right)
- Ensure sidebar collapses properly on small screens

### 5. Toast Feedback Consistency
Some mutations show success toasts, some do not. Ensure all user actions (save profile, create bid, sign contract, etc.) show appropriate Arabic toast messages on success and error.

### 6. Project Details Contract Tab -- Association Sign Action
The contract tab on ProjectDetails shows contract info but the association currently has no way to sign from there. Add a "Sign Contract" button in the contract tab when `association_signed_at` is null and user is the association.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Replace static "recent activity" card with real notification feed |
| `src/pages/Projects.tsx` | Add empty state with CTA |
| `src/pages/MyServices.tsx` | Add empty state with CTA |
| `src/pages/MyBids.tsx` | Add empty state with CTA |
| `src/pages/Earnings.tsx` | Add empty state with icon |
| `src/pages/ProjectDetails.tsx` | Add association contract signing in contract tab |
| `src/pages/Notifications.tsx` | Ensure consistent loading skeleton |

## New Files

| File | Purpose |
|------|---------|
| `src/components/EmptyState.tsx` | Reusable empty state component with icon, message, and optional CTA button |
| `src/components/dashboard/RecentActivity.tsx` | Activity feed component pulling from notifications |

---

## Technical Details

### Recent Activity Feed
```text
RecentActivity component:
  1. Query notifications for current user, ordered by created_at desc, limit 8
  2. Map notification type to icon (bid_accepted -> FileText, contract_signed -> Check, etc.)
  3. Display as a timeline-style list with relative timestamps (e.g., "منذ 3 ساعات")
  4. Link "View all" to /notifications
```

### Empty State Component
```text
EmptyState({ icon, title, description, actionLabel?, actionHref? })
  - Centered icon (muted color, 48px)
  - Title text
  - Description text
  - Optional Button linking to actionHref
```

### Project Details Contract Signing
```text
In the contract tab:
  - If user is association and association_signed_at is null:
    - Show "Sign Contract" button
    - On click: call useSignContract with contract.id
    - Invalidate contract query on success
```

### No Database Changes
All data already exists. This stage only improves the frontend presentation layer.

