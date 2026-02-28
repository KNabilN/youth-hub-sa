

# Comprehensive RTL Consistency Fix - Full System Review

## Problem
Despite previous RTL fixes, many components still use physical CSS properties (left/right, ml/mr, pl/pr) instead of logical ones (start/end, ms/me, ps/pe). This causes inconsistent RTL behavior across the application.

## Changes Required

### 1. Fix `ml-` and `mr-` to `ms-` and `me-` across all components

**Files and specific fixes:**

- **`src/pages/MyBids.tsx`** (line 136): `ml-1` on icon inside button -> `me-1`
- **`src/components/provider/WorkTimer.tsx`** (line 64): `mr-2` -> `me-2`
- **`src/pages/admin/AdminCMS.tsx`** (lines 85, 139, 194, 253, 349): all `ml-1` on icons -> `me-1`
- **`src/components/PaginationControls.tsx`** (line 21): `ml-1` -> `me-1`; (line 27): `mr-1` -> `ms-1`
- **`src/components/bids/BidCard.tsx`** (lines 54, 58): `ml-1` -> `me-1`
- **`src/pages/admin/AdminReports.tsx`** (line 337): `ml-2` -> `me-2`, `mr-2` -> `ms-2`

### 2. Fix physical positioning properties

- **`src/components/AppSidebar.tsx`** (line 97): `-right-1` -> `-end-1` or use `[inset-inline-end:-0.25rem]`
- **`src/components/AccessibilityWidget.tsx`** (line 46): `left-4` -> `start-4` (accessibility widget should be on start side)
- **`src/components/messages/ConversationList.tsx`** (line 65): `-right-1` -> use `[inset-inline-end:-0.25rem]`
- **`src/pages/Index.tsx`** (line 76): `left-1/2` -> keep as-is (centering is direction-independent)

### 3. Fix `text-left` / `text-right` remaining instances

- **`src/components/ui/drawer.tsx`** (line 47): `sm:text-left` -> `sm:text-start`
- **`src/components/messages/ConversationList.tsx`** (line 53): `text-right` -> `text-start` (since in RTL, start IS right)

### 4. Fix physical border properties

- **`src/components/ui/scroll-area.tsx`** (line 27): `border-l` -> `border-s` (scrollbar track)

### 5. Fix sidebar component physical properties

- **`src/components/ui/sidebar.tsx`** (line 278): `ml-2` and `ml-0` -> `ms-2` and `ms-0`
- **`src/components/ui/sidebar.tsx`** (line 415): `pr-8` -> `pe-8` in menu button variants

### 6. AdminUserDetail action bar - RTL UX improvement

- **`src/pages/admin/AdminUserDetail.tsx`**: Swap the order of the action buttons div and the back button in the sticky action bar so that the "back" navigation is on the right (start in RTL) and action buttons are on the left (end in RTL), following standard RTL navigation patterns.

## Technical Details

### Logical property mapping applied:
```text
ml-*  ->  ms-*  (margin-start)
mr-*  ->  me-*  (margin-end)
pl-*  ->  ps-*  (padding-start)
pr-*  ->  pe-*  (padding-end)
left-*  ->  start-*
right-*  ->  end-*
border-l-*  ->  border-s-*
border-r-*  ->  border-e-*
text-left  ->  text-start
text-right  ->  text-end
```

### Files to modify (14 total):
1. `src/pages/MyBids.tsx`
2. `src/components/provider/WorkTimer.tsx`
3. `src/pages/admin/AdminCMS.tsx`
4. `src/components/PaginationControls.tsx`
5. `src/components/bids/BidCard.tsx`
6. `src/pages/admin/AdminReports.tsx`
7. `src/components/AppSidebar.tsx`
8. `src/components/AccessibilityWidget.tsx`
9. `src/components/messages/ConversationList.tsx`
10. `src/components/ui/drawer.tsx`
11. `src/components/ui/scroll-area.tsx`
12. `src/components/ui/sidebar.tsx`
13. `src/pages/admin/AdminUserDetail.tsx`
14. `src/pages/Index.tsx` (verify centering is OK)

### Notes:
- UI component files (shadcn) like popover, tooltip, select use `data-[side=left/right]` for animation directions - these are Radix-controlled and should NOT be changed
- `dir="ltr"` on specific input fields (email, phone, numbers) is intentional and correct
- The `AuthModal.tsx` `fixed left-[50%]` centering pattern is direction-independent and should stay
