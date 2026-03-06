

## التعديل المطلوب

عند قبول عرض مزود الخدمة، يجب تحديث ميزانية الطلب (`budget`) لتتطابق مع سعر العرض المقبول.

## التغيير

**ملف واحد: `src/hooks/useBids.ts`**

في `useAcceptBid`، عند تحديث المشروع (الخطوة 3)، إضافة `budget: bidPrice` بجانب `assigned_provider_id`. يتطلب هذا تمرير `bidPrice` كمعامل إضافي للـ mutation.

```typescript
// قبل
mutationFn: async ({ bidId, projectId, providerId })
  .update({ assigned_provider_id: providerId })

// بعد  
mutationFn: async ({ bidId, projectId, providerId, bidPrice })
  .update({ assigned_provider_id: providerId, budget: bidPrice })
```

ثم تحديث أماكن استدعاء `acceptBid.mutateAsync` في `BidPaymentDialog.tsx` لتمرير `bidPrice: bid.price`.

