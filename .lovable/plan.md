

## إصلاح: فواتير طلبات السحب المقبولة لا تظهر عند مزود الخدمة

### المشكلة
عند الموافقة على طلب سحب لمزود خدمة، لا يتم إصدار فاتورة له. السبب:
- دالة `handleApproveWithdrawal` في `AdminFinance.tsx` تحدث حالة السحب فقط وترفق الإيصال، لكنها **لا تنشئ فاتورة** لمزود الخدمة.
- الفواتير الموجودة مربوطة بالجمعية (الدافع) عبر `issued_to = payer_id`، وليس بمزود الخدمة.

### الحل
عند الموافقة على طلب السحب، نُصدر فاتورة جديدة لمزود الخدمة تحتوي على تفاصيل المبلغ المحول.

#### التعديلات:

**1. `src/pages/admin/AdminFinance.tsx`** — في `handleApproveWithdrawal`:
- بعد نجاح تحديث حالة السحب، استدعاء `useGenerateInvoice` لإصدار فاتورة باسم مزود الخدمة (`provider_id`).
- نحتاج جلب `escrow_id` و `provider_id` من بيانات طلب السحب المتاحة.

```typescript
// بعد نجاح updateW.mutate:
const withdrawal = withdrawals?.find(w => w.id === wTargetId);
if (withdrawal?.escrow_id) {
  generateInvoice.mutate({
    escrowId: withdrawal.escrow_id,
    amount: Number(withdrawal.amount),
    issuedTo: withdrawal.provider_id,
  });
}
```

**2. `src/hooks/useMyInvoices.ts`** — لا تحتاج تعديل، لأنها تستعلم بناءً على `issued_to = user.id` وستعرض الفاتورة الجديدة تلقائياً.

### ملخص الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `src/pages/admin/AdminFinance.tsx` | إضافة استدعاء `useGenerateInvoice` عند الموافقة على طلب السحب |

