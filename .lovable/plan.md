

# Stage 13: Remaining Low-Priority Features and Polish

All high and medium priority items from Stages 11 and 12 are now complete. This stage tackles the remaining deferred items to bring the platform closer to full specification compliance.

---

## Completed So Far (Stages 11-12)

- Profile fields (phone, organization_name, avatar upload, hourly rate)
- Admin suspend/activate, audit log, CSV export
- Service purchase flow with escrow
- Withdrawal requests (provider + admin)
- Bidirectional ratings
- Escrow freeze on dispute
- Enhanced admin analytics (by category, region, approval status)
- Public provider profile page

---

## Remaining Items for Stage 13

| # | Feature | Effort |
|---|---------|--------|
| 1 | **Service edit resets approval to pending** | Small |
| 2 | **Marketplace sort by provider rating** | Small |
| 3 | **Mandatory rating prompt after completed contract** | Medium |
| 4 | **Stop time log entry when dispute is open** | Small |
| 5 | **Accessibility widget** (text zoom + contrast toggle) | Medium |
| 6 | **Donor access to marketplace in sidebar** | Small |

---

## Implementation Plan

### 1. Service Edit Resets Approval
When a provider edits a service, automatically set `approval` back to `pending` so admin must re-approve.

**Changes:**
- `src/hooks/useMyServices.ts` -- In `useUpdateService`, force `approval: 'pending'` in the update payload
- `src/pages/MyServices.tsx` -- Show a warning message that editing will pause the service until admin re-approves

### 2. Marketplace Sort by Rating
Add a sort option in the marketplace to order services by provider average rating.

**Changes:**
- `src/pages/Marketplace.tsx` -- Add a sort dropdown (newest / price / rating)
- Query provider ratings alongside services and sort client-side by average rating when selected

### 3. Mandatory Rating Prompt
After a contract is marked `completed`, show a prompt/banner on the dashboard directing the user to rate.

**Changes:**
- `src/pages/Dashboard.tsx` -- Query contracts with status `completed` where the current user hasn't rated yet; show a banner linking to `/ratings`
- Create `src/hooks/usePendingRatings.ts` -- Query for unrated completed contracts

### 4. Block Time Logging During Dispute
Prevent providers from logging hours on disputed projects.

**Changes:**
- `src/pages/TimeTracking.tsx` -- Filter out projects with status `disputed` from the project selector
- `src/components/provider/TimeEntryForm.tsx` -- Disable submission if project is disputed

### 5. Accessibility Widget
Add a floating accessibility button with text zoom and high contrast toggles.

**Changes:**
- Create `src/components/AccessibilityWidget.tsx` -- Floating button (bottom-left) that opens a popover with:
  - Text size: increase/decrease (adjusts root `font-size`)
  - High contrast toggle (adds a CSS class to `<html>`)
- `src/App.tsx` -- Render the widget globally
- `src/index.css` -- Add `.high-contrast` CSS class with enhanced contrast colors

### 6. Donor Marketplace Access in Sidebar
Donors can purchase services but the marketplace link is missing from their sidebar menu.

**Changes:**
- `src/components/AppSidebar.tsx` -- Add "سوق الخدمات" to the donor menu items

---

## Technical Details

### Service Edit Approval Reset

In `useMyServices.ts` `useUpdateService`:
```text
// Force approval back to pending on any edit
const { data, error } = await supabase
  .from("micro_services")
  .update({ ...values, approval: "pending" })
  .eq("id", id)
```

### Pending Ratings Hook

```text
usePendingRatings():
  1. Get user's completed contracts (as association or provider)
  2. Left join with ratings where rater_id = current user
  3. Filter where no rating exists
  4. Return count and list of unrated contracts
```

### Accessibility Widget

```text
AccessibilityWidget component:
  - State: fontSize (default 16), highContrast (default false)
  - On font size change: document.documentElement.style.fontSize = `${fontSize}px`
  - On contrast toggle: document.documentElement.classList.toggle('high-contrast')
  - Floating button with Accessibility icon (bottom-left corner)
  - Popover with slider for text size + switch for contrast
```

### High Contrast CSS

```text
.high-contrast {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --primary: 220 90% 40%;
  --muted-foreground: 0 0% 20%;
}
```

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/hooks/useMyServices.ts` -- reset approval on edit |
| Modify | `src/pages/MyServices.tsx` -- warning about re-approval |
| Modify | `src/pages/Marketplace.tsx` -- add sort by rating option |
| Modify | `src/pages/Dashboard.tsx` -- pending rating banner |
| Modify | `src/components/AppSidebar.tsx` -- add marketplace to donor menu |
| Modify | `src/App.tsx` -- render AccessibilityWidget |
| Modify | `src/index.css` -- high contrast styles |
| Create | `src/hooks/usePendingRatings.ts` -- unrated contracts query |
| Create | `src/components/AccessibilityWidget.tsx` -- floating accessibility controls |

No database migrations required for this stage.
