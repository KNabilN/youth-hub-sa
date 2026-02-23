
# Improve Admin Settings - Add Records Experience

## Problem
The current "add" button is a small icon-only button ("+") that may not be obvious. The form layout could be improved to make adding categories and regions more intuitive with clearer action buttons and better feedback.

## Changes

### 1. CategoryManager - Better Add Form (`src/components/admin/CategoryManager.tsx`)
- Replace the small icon-only "+" button with a full "اضافة" (Add) button that has both an icon and text label
- Add a loading spinner when the mutation is in progress
- Add `type="button"` explicitly to prevent any form submission issues
- Make the button more visually prominent (not just `size="icon"`)

### 2. RegionManager - Better Add Form (`src/components/admin/RegionManager.tsx`)
- Same improvements: replace icon-only button with labeled "اضافة" button
- Add loading state feedback
- Make the add action more discoverable

### 3. Visual Improvements
- Increase the add button size from `size="icon"` to default size with text + icon
- Add a subtle success animation/feedback on successful add
- Ensure the input fields and button are properly aligned

## Technical Details

**CategoryManager changes:**
- Line 84: Change `<Button size="icon">` to `<Button>` with `<Plus /> اضافة` children
- Add `className` for min-width so button doesn't shrink

**RegionManager changes:**
- Same pattern: replace icon-only add button with labeled button

No database changes needed. The backend already works correctly -- this is purely a UI discoverability improvement.
