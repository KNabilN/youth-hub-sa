

## Problem
The "تعذر فتح الاستفسار" toast appears (twice) when opening the service inquiry sheet because of a **race condition**:

- `useServiceInquiry` query is enabled when the sheet opens, but takes time to return existing inquiry
- `handleOpen` checks `if (!inquiry && !createdInquiry)` immediately — since `inquiry` is `undefined` while loading, it triggers `createInquiry.mutateAsync`
- The DB has a `UNIQUE (service_id, sender_id)` constraint on `service_inquiries`, so when an inquiry already exists, the INSERT fails with a unique violation → toast error
- The double toast also suggests `handleOpen` may be triggered twice (Sheet open state changes)

## Fix — `src/components/services/ServiceInquirySheet.tsx`

1. **Prefetch the existing inquiry** before the user clicks (enable the query unconditionally with the serviceId so it's ready by the time the sheet opens), OR
2. **Wait for the query to settle** inside `handleOpen` before deciding to create, AND
3. **Guard against double-create** using a ref (`useRef`) so concurrent open events don't both fire `mutateAsync`, AND
4. **Gracefully handle unique-violation (code `23505`)** — if creation fails because the row already exists, refetch the inquiry instead of showing an error toast.

### Updated logic (concept)
```ts
const { data: inquiry, isLoading, refetch } = useServiceInquiry(serviceId); // always enabled
const creatingRef = useRef(false);

const handleOpen = async (isOpen: boolean) => {
  setOpen(isOpen);
  if (!isOpen) return;
  // Wait for existing query if still loading
  const existing = inquiry ?? (await refetch()).data;
  if (existing || createdInquiry || creatingRef.current) return;
  creatingRef.current = true;
  try {
    const result = await createInquiry.mutateAsync({ serviceId, providerId });
    setCreatedInquiry(result.id);
  } catch (err: any) {
    if (err?.code === "23505") {
      const r = await refetch();
      if (r.data) return; // silent recover
    }
    toast.error("تعذر فتح الاستفسار");
    setOpen(false);
  } finally {
    creatingRef.current = false;
  }
};
```

Also adjust `useServiceInquiry` enable condition so it can prefetch (already enabled when serviceId provided — just call it with the real serviceId, not gated by `open`).

This eliminates the toast spam and the false error while preserving the existing chat experience.

