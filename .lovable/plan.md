

# Fix: Moyasar `request_payload: null` Bug

## Problem
The Moyasar API logs show `request_payload: null` — the payment form loads visually but when the user submits, no card data is sent to Moyasar's API. This is a **real bug** that must be fixed before going live.

## Root Cause
The `MoyasarPaymentForm` component has two issues:

1. **No re-initialization guard**: The `initialized` state is set but never checked. If any dependency (`amount`, `description`, `callbackUrl`, `publishableKey`) changes or React re-renders, `container.innerHTML = ""` destroys Moyasar's internal form state mid-lifecycle, causing the SDK to lose track of card input fields.

2. **No cleanup function**: When the effect re-runs or the component unmounts, there's no proper cleanup — the old Moyasar instance lingers while a new one is created, causing conflicts.

## Fix in `src/components/payment/MoyasarPaymentForm.tsx`

1. **Add an `initRef` guard** to prevent double-initialization with the same parameters
2. **Use a unique container ID** instead of a shared CSS class selector (`.moyasar-form`) to avoid conflicts if multiple forms exist
3. **Add proper cleanup** to avoid dangling Moyasar instances
4. **Skip re-init if already initialized** with the same parameters — only re-init if amount/key actually changed

### Key change:
```typescript
const initId = useRef("");

// Inside effect:
const key = `${amount}-${publishableKey}-${callbackUrl}`;
if (initId.current === key) return; // already initialized with same params
initId.current = key;

// Use unique ID selector instead of class
const formId = useId();
window.Moyasar.init({
  element: `#moyasar-${formId}`,
  ...
});
```

## Additional: Production Readiness Note
The current publishable key is `pk_test_...` (test mode). When switching to production:
- Replace the `MOYASAR_PUBLISHABLE_KEY` secret with the `pk_live_...` key
- Replace the `MOYASAR_SECRET_KEY` secret with the `sk_live_...` key
- No code changes needed — just update the secrets

## Files Changed
- `src/components/payment/MoyasarPaymentForm.tsx` — fix re-initialization logic

