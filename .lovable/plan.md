

## Analysis: Moyasar `request_payload: null` Issue

### Root Cause

The `metadata` prop passed to `MoyasarPaymentForm` in `Checkout.tsx` (line 400-403) is an **inline object literal**:

```tsx
metadata={{
  type: "checkout",
  user_id: user?.id,
}}
```

This creates a **new object reference on every render**, which triggers the `useEffect` dependency array (`[amount, description, callbackUrl, publishableKey, metadata]`) to re-run repeatedly. Each re-run calls `container.innerHTML = ""` and reinitializes the form, destroying any card data the user has entered. When the user submits, the form may have been just reset, resulting in `request_payload: null`.

### Fix

**File: `src/components/payment/MoyasarPaymentForm.tsx`**
- Store `metadata` in a `useRef` instead of including it in the `useEffect` dependency array, so form initialization only happens once when the key props change
- Remove `metadata` from the dependency array and use `metadataRef.current` inside the effect

**File: `src/pages/Checkout.tsx`**
- Memoize the `metadata` object with `useMemo` so it has a stable reference

Both fixes together prevent the form from being destroyed and recreated on every render.

### Additional: Moyasar `element` parameter
Moyasar MPF docs recommend passing a **CSS selector string** (e.g. `".moyasar-form"`) rather than a DOM element for the `element` config. Will update to use the selector string for better compatibility.

