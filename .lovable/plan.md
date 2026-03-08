

## إصلاح خطأ الموافقة على التحويل البنكي

### المشكلة
عند الموافقة على تحويل بنكي، تفشل العملية لأن دالة `useApproveBankTransfer` تحاول تحديث حالة الضمان المالي من `pending_payment` إلى `held` فقط (سطر 184 في `useBankTransfer.ts`):
```
.eq("status", "pending_payment")
```

لكن الضمان المالي المرتبط بالتحويل (1,250 ر.س) كانت حالته `under_review` — وهي حالة صالحة يمكن للأدمن تحويلها يدوياً من `pending_payment`. هذا يعني أن الـ optimistic lock يرفض التحديث ويرمي الخطأ "تم تعديل حالة الضمان مسبقاً".

### الحل

#### 1. تعديل `src/hooks/useBankTransfer.ts` — دالة `useApproveBankTransfer`
- تعديل شرط الـ optimistic lock ليقبل حالتي `pending_payment` و `under_review`:
  ```typescript
  .in("status", ["pending_payment", "under_review"])
  ```
  بدلاً من:
  ```typescript
  .eq("status", "pending_payment")
  ```

#### 2. تعديل `src/pages/admin/AdminFinance.tsx` — عرض الخطأ الفعلي
- تحسين `onError` ليعرض رسالة الخطأ الحقيقية بدلاً من "حدث خطأ":
  ```typescript
  onError: (err: any) => toast.error(err?.message || "حدث خطأ")
  ```

### الملفات المتأثرة
| # | الملف | التغيير |
|---|---|---|
| 1 | `src/hooks/useBankTransfer.ts` | توسيع شرط حالة الضمان ليشمل `under_review` |
| 2 | `src/pages/admin/AdminFinance.tsx` | عرض رسالة الخطأ التفصيلية |

