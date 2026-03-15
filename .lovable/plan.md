

# Fix Moyasar Payment Form Not Appearing

## Problem
After `container.innerHTML = ""`, `Moyasar.init({ element: "#formId" })` uses a CSS selector to find the element. This fails because the selector lookup can miss the element due to timing or React's rendering cycle. The console also shows a ref warning from Donations.tsx trying to pass a ref to the function component.

## Solution
Pass the DOM node directly to `Moyasar.init` instead of a CSS selector string, and wrap initialization in `requestAnimationFrame` for DOM stability.

## Changes

### `src/components/payment/MoyasarPaymentForm.tsx`
- Change `element: "#${formId}"` → `element: container` (direct DOM node)
- Remove `useId` and `formId` (no longer needed)
- Keep a stable `id` on the div for CSS styling but don't use it for Moyasar
- Wrap `doInit` call in `requestAnimationFrame` after clearing innerHTML
- Add `try-catch` around `Moyasar.init`

