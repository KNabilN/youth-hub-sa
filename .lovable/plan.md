

# Fix Header Overlapping Sidebar and Content Shrinking

## Problem
From the screenshot, two issues are visible:
1. The top header bar renders **on top of** the sidebar when it's open (the header has `z-30` while the sidebar only has `z-10`)
2. The main content area shrinks when the sidebar opens instead of maintaining its width

## Root Cause
In `sidebar.tsx` line 195, the fixed sidebar panel uses `z-10`. The header in `DashboardLayout.tsx` uses `sticky top-0 z-30`, which is higher, causing the header to paint over the sidebar.

For the shrinking issue, the content area needs `min-w-0` to prevent flex items from being squeezed, and the outer container should allow horizontal overflow so content doesn't compress.

## Changes

### File 1: `src/components/ui/sidebar.tsx`
- Line 195: Change `z-10` to `z-40` on the fixed sidebar panel so it renders above the header (`z-30`)

### File 2: `src/components/DashboardLayout.tsx`
- Add `min-w-0` to the content wrapper div to prevent flex shrinking
- Add `overflow-x-auto` to allow the content to scroll if needed rather than compress

| File | Change |
|------|--------|
| `src/components/ui/sidebar.tsx` | Sidebar z-index `z-10` to `z-40` |
| `src/components/DashboardLayout.tsx` | Add `min-w-0` to content div |

2 files, minimal CSS-only changes.
