

## خطة تأمين المنصة من الضغط المزدوج وحماية المعاملات المالية

### المشاكل المكتشفة

#### 1. عدم وجود حماية من الإعادة (Replay Attack) في التحقق من الدفع الإلكتروني
الـ Edge Function `moyasar-verify-payment` لا تتحقق مما إذا كان `payment_id` تم معالجته مسبقاً. يمكن لمهاجم إعادة إرسال نفس الطلب لإنشاء ضمانات مالية مكررة.

- `processCheckout` -- لا يوجد أي فحص idempotency (بعكس `processProjectPayment` الذي يتحقق)
- `processDonation` -- نفس المشكلة

#### 2. حماية الضغط المزدوج في بعض الأزرار ناقصة
معظم الأزرار محمية بـ `disabled={isPending}` لكن بعض المواضع تحتاج تحسين:

- **`Checkout.tsx` - زر "تأكيد"**: يستخدم `processing` state لكن يمر عبر `ConfirmDialog` -- محمي جزئياً لكن يجب التأكد أن `handleCheckout` لا تُنفذ مرتين
- **`Donations.tsx` - `handlePaymentConfirm`**: محمي بـ `processing` state -- جيد
- **`BidPaymentDialog`**: محمي بـ `loadingPayment` + `isPending` -- جيد

#### 3. عمليات استهلاك المنح غير ذرية (Race Condition)
`usePayFromGrants` يقوم بعدة عمليات INSERT/UPDATE متتابعة على `donor_contributions` بدون transaction. إذا نُفذت عمليتان متزامنتان، يمكن استهلاك نفس المنحة مرتين.

---

### الحلول المقترحة

#### التعديل 1: إضافة idempotency للـ Edge Function (حرج أمنياً)

**ملف:** `supabase/functions/moyasar-verify-payment/index.ts`

- فحص `payment_id` في بداية الدالة: البحث في `escrow_transactions` أو جدول مخصص عما إذا تم معالجة هذا الدفع سابقاً
- إضافة `payment_id` كـ metadata في الـ escrow لمنع التكرار
- إضافة idempotency check لـ `processCheckout` و `processDonation` مماثل لـ `processProjectPayment`

```text
الفلو المقترح:
1. استلام payment_id
2. التحقق من Moyasar API
3. فحص: هل payment_id موجود مسبقاً في escrow_transactions؟
   → نعم: إرجاع verified: true بدون إنشاء شيء جديد
   → لا: متابعة الإنشاء الطبيعي
```

#### التعديل 2: حماية الضغط المزدوج في `handleCheckout`

**ملف:** `src/pages/Checkout.tsx`

- إضافة guard في بداية `handleCheckout`: `if (processing) return;`
- هذا يمنع أي تنفيذ مزدوج حتى لو تم تجاوز `ConfirmDialog`

#### التعديل 3: حماية الضغط المزدوج في المدفوعات عبر `BidPaymentDialog`

**ملف:** `src/components/bids/BidPaymentDialog.tsx`

- إضافة `if (loadingPayment) return;` في بداية كل من:
  - `handleAcceptAndPay`
  - `handleBankTransfer`
  - `handleGrantPayment`
  - `handleMixedPayment`

#### التعديل 4: حماية الضغط المزدوج في `Donations.tsx`

**ملف:** `src/pages/Donations.tsx`

- إضافة `if (processing) return;` في `handlePaymentConfirm` و `handleOnlinePayment`

#### التعديل 5: حماية استهلاك المنح من Race Condition

**ملف:** `src/hooks/usePayFromGrants.ts`

- إضافة mutex/flag بسيط: `if (mutationRunning) return` باستخدام `useRef`
- هذا يمنع تشغيل المنطق مرتين على الأقل من نفس الجلسة

#### التعديل 6: حماية `usePurchaseService` من التكرار

**ملف:** `src/hooks/usePurchaseService.ts`

- لا يحتاج تعديل — محمي بـ `useMutation` الذي لا ينفذ مرتين أثناء `isPending`

#### التعديل 7: حماية `useCreateBankTransfer` من التكرار

**ملف:** `src/hooks/useBankTransfer.ts`

- محمي بـ `useMutation` -- لكن إضافة guard إضافي في `handleCheckout` و `handleBankTransfer`

---

### الملفات المتأثرة

| # | الملف | التعديل | الأولوية |
|---|---|---|---|
| 1 | `supabase/functions/moyasar-verify-payment/index.ts` | idempotency check بـ payment_id لمنع replay attacks | **حرج** |
| 2 | `src/pages/Checkout.tsx` | guard ضد الضغط المزدوج | عالي |
| 3 | `src/components/bids/BidPaymentDialog.tsx` | guard في كل دوال الدفع | عالي |
| 4 | `src/pages/Donations.tsx` | guard في دوال الدفع | عالي |
| 5 | `src/hooks/usePayFromGrants.ts` | حماية من race condition | عالي |

