

# Fix: "إضافة خدمة" Button in Empty State

## Problem
The "إضافة خدمة" button shown in the empty state uses the `EmptyState` component which navigates to `actionHref="#"` -- it does a route navigation instead of opening the service creation dialog (`setFormOpen(true)`).

## Solution
Replace the `EmptyState` component usage with either:
- An `onAction` callback prop added to `EmptyState`, or
- Inline empty state markup that calls `setFormOpen(true)` directly.

The simplest fix: add an optional `onAction` callback to `EmptyState` so when provided, it calls that instead of navigating.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/EmptyState.tsx` | Add optional `onAction` callback prop; when provided, use it instead of `navigate(actionHref)` |
| `src/pages/MyServices.tsx` | Pass `onAction={() => setFormOpen(true)}` to `EmptyState` instead of `actionHref="#"` |

## Technical Detail

In `EmptyState.tsx`, add:
```
onAction?: () => void;
```

In the button's `onClick`:
- If `onAction` is provided, call `onAction()`
- Otherwise, fall back to `navigate(actionHref)`

In `MyServices.tsx`, change from:
```
actionHref="#"
```
to:
```
onAction={() => setFormOpen(true)}
```

