
# Service Provider ("مزودي الخدمة") - Feature Completion Plan

## Current State Analysis

The service provider role has the following pages and features already implemented:

| Feature | Page | Status |
|---------|------|--------|
| Dashboard with stats | `/dashboard` | Working |
| My Services (CRUD) | `/my-services` | Working |
| Available Projects | `/available-projects` | Working |
| Project Bid View | `/available-projects/:id` | Working |
| My Bids | `/my-bids` | Working |
| My Projects (assigned) | `/my-projects` | Needs polish |
| Contracts | `/contracts` | Needs polish |
| Time Tracking | `/time-tracking` | Working |
| Earnings + Withdrawals | `/earnings` | Working |
| Invoices | `/invoices` | Needs polish |
| Ratings | `/ratings` | Exists |
| Disputes | `/my-disputes` | Needs polish |
| Marketplace | `/marketplace` | Working |
| Provider Public Profile | `/providers/:id` | Partially working (RLS issue) |

## Identified Gaps and Improvements

### Gap 1: Provider Public Profile RLS Issue
The `profiles` table RLS only allows users to view their own profile and admins to view all. When another user visits `/providers/:id`, the query will fail because there's no policy allowing public/cross-user reads of profiles. This breaks the Marketplace's "view provider" links.

**Fix:** Add an RLS policy allowing authenticated users to read profiles (at minimum `full_name`, `bio`, `avatar_url`, `hourly_rate`, `is_verified`).

### Gap 2: "My Projects" Page Missing Polish
The page lacks a styled header (icon + subtitle), filter panel styling, and the gradient divider used consistently elsewhere.

### Gap 3: "Contracts" Page Missing Polish
Same issue: no page header icon, no styled filter card, inconsistent with other provider pages.

### Gap 4: "Invoices" Page Missing Polish
No page header with icon/subtitle, no styled container, plain table without the visual treatment other pages have.

### Gap 5: "My Disputes" Page Missing Polish
No page header icon, no styled header, and no ability for the provider to create a new dispute from this page.

### Gap 6: No "Create Dispute" Flow for Providers
Providers can see disputes but cannot raise new disputes from the UI. There should be a button to raise a dispute against an assigned project.

### Gap 7: Provider Profile Page is Basic
The `/providers/:id` page is functional but lacks visual treatment: no page header, no stats cards (completed projects count, total reviews), no review/comment listing.

---

## Implementation Plan

### 1. Database: Add Profile Public Read Policy
Add an RLS policy on the `profiles` table to allow any authenticated user to SELECT profiles (read-only). This enables the provider profile page to work cross-user.

```sql
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);
```

This is a permissive policy added alongside existing ones. No sensitive data is exposed (profiles contain `full_name`, `bio`, `avatar_url`, etc.).

### 2. Polish "My Projects" Page (`src/pages/MyProjects.tsx`)
- Add styled page header with `FolderKanban` icon in `bg-primary/10` container
- Add subtitle text
- Add gradient divider line
- Wrap filter in a styled dashed `Card`

### 3. Polish "Contracts" Page (`src/pages/Contracts.tsx`)
- Add styled page header with `ScrollText` icon
- Add subtitle and gradient divider
- Wrap filter in styled dashed `Card`

### 4. Polish "Invoices" Page (`src/pages/Invoices.tsx`)
- Add styled page header with `Receipt` icon
- Add subtitle and gradient divider
- Add row hover styling and alternating backgrounds

### 5. Polish "My Disputes" Page (`src/pages/MyDisputes.tsx`)
- Add styled page header with `Gavel` icon
- Add subtitle and gradient divider
- Add "رفع نزاع" (Raise Dispute) button linking to assigned projects where a dispute can be filed
- Add a simple dialog to create a dispute (select project + description)

### 6. Enhance Provider Public Profile (`src/pages/ProviderProfile.tsx`)
- Add stats cards: completed projects count, total reviews count, average rating
- Add styled page header
- Show list of ratings/reviews from other users with scores and comments
- Better visual layout with gradient accents

### 7. Files Modified Summary

| File | Change |
|------|--------|
| `src/pages/MyProjects.tsx` | Add styled header, filter card, gradient divider |
| `src/pages/Contracts.tsx` | Add styled header, filter card, gradient divider |
| `src/pages/Invoices.tsx` | Add styled header, gradient divider, table styling |
| `src/pages/MyDisputes.tsx` | Add styled header, gradient divider, create dispute dialog |
| `src/pages/ProviderProfile.tsx` | Add stats cards, reviews section, visual polish |
| Database migration | Add profile public read RLS policy |

No new files need to be created. All changes use existing UI components already in the project.
