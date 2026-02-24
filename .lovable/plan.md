
# Fix Sidebar RTL Positioning and Alignment

## Problem
The sidebar is positioned on the **left** side of the screen, but since this is an Arabic RTL platform, it should appear on the **right** side. Additionally, several internal styling details use physical CSS properties (left/right) instead of logical ones, causing misalignment.

## Root Causes

1. **`<Sidebar>` defaults to `side="left"`** (line 138 of sidebar.tsx) - The component uses `left-0` fixed positioning, placing it on the wrong side for RTL.
2. **Active link border uses `border-r-[3px]`** - In an RTL layout, this appears on the visual left (wrong side). Should use `border-l-[3px]` (which renders on the visual right in RTL).
3. **Online status dot uses `-left-1`** - Should use `-right-1` for RTL so the green dot appears correctly relative to the avatar.
4. **`SidebarMenuButton` has hardcoded `text-left`** in the sidebar.tsx component - Should be `text-start` for RTL compatibility.
5. **`DashboardLayout` flex order** - With sidebar on the right, the content should come first in the DOM order, then the sidebar.
6. **Notification badge uses `mr-auto`** - Should use `ms-auto` (margin-inline-start) for logical RTL spacing.

## Changes

### File 1: `src/components/AppSidebar.tsx`
- Change `<Sidebar>` to `<Sidebar side="right">` to position on the right
- Change all `border-r-[3px]` in activeClassName to `border-l-[3px]` (visual right in RTL)
- Change online dot from `-left-1` to `-right-1`
- Change `mr-auto` on NotificationBadge to `ms-auto`

### File 2: `src/components/DashboardLayout.tsx`
- Reorder flex children: content first, then sidebar (so sidebar appears on the right in the DOM flow alongside `side="right"`)
- Change `flex` to `flex flex-row-reverse` to ensure correct ordering with the fixed sidebar

### File 3: `src/components/ui/sidebar.tsx`
- Change `text-left` to `text-start` in `sidebarMenuButtonVariants` (line 415) for proper RTL text alignment
- This is a minimal, safe change that only affects text direction

## Summary

| File | Change |
|------|--------|
| `src/components/AppSidebar.tsx` | `side="right"`, fix active borders, dot position, badge margin |
| `src/components/DashboardLayout.tsx` | Adjust flex order for RTL sidebar placement |
| `src/components/ui/sidebar.tsx` | `text-left` to `text-start` in menu button variants |

3 files modified, no new files. All changes are CSS/prop adjustments with no logic changes.
