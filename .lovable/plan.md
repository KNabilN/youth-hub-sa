

## خطة: دمج بوابة دفع Moyasar كوسيلة الدفع الإلكتروني

### نظرة عامة

Moyasar توفر مفتاحين: **Publishable Key** (آمن للاستخدام في الفرونت إند) و **Secret Key** (للباكند فقط). سنستخدم نهج Moyasar الرسمي:

1. **الفرونت إند**: يستخدم Publishable Key لعرض نموذج الدفع عبر مكتبة `moyasar-payment-form`
2. **Edge Function**: تستخدم Secret Key للتحقق من صحة الدفع بعد الإتمام
3. **Callback**: بعد إتمام الدفع يُعاد المستخدم لصفحة خاصة تتحقق من الدفع وتنشئ الضمان المالي

### التدفق

```text
المستخدم ← نموذج Moyasar (publishable key) ← 3DS ← callback_url
  ↓
/payment-callback?id=xxx&status=paid
  ↓
Edge Function: verify-payment (secret key) → تأكيد المبلغ والحالة
  ↓
إنشاء escrow + donor_contributions + مسح السلة
  ↓
/payment-success
```

### الملفات والتغييرات

#### 1. إعداد المفاتيح
- حفظ `MOYASAR_SECRET_KEY` كسر في Lovable Cloud (للـ edge function)
- حفظ `MOYASAR_PUBLISHABLE_KEY` كسر أيضاً (يُستخدم من edge function لإنشاء الدفع)
- تخزين Publishable Key في متغير بيئة `VITE_MOYASAR_PUBLISHABLE_KEY` أو تمريره من edge function

#### 2. Edge Function جديدة: `supabase/functions/moyasar-create-payment/index.ts`
- تستقبل: قائمة العناصر، معرف المستخدم، معرف الجمعية المستفيدة (اختياري)
- تنشئ دفعة عبر Moyasar API باستخدام Publishable Key مع `callback_url`
- تُرجع `transaction_url` للتوجيه إلى 3DS

#### 3. Edge Function جديدة: `supabase/functions/moyasar-verify-payment/index.ts`
- تستقبل: `payment_id` من Moyasar
- تتحقق من الدفع عبر Moyasar API (GET /v1/payments/:id) باستخدام Secret Key
- تتأكد من `status === 'paid'` والمبلغ والعملة
- تنشئ سجلات escrow_transactions و donor_contributions
- تُرجع نتيجة التحقق

#### 4. صفحة جديدة: `src/pages/PaymentCallback.tsx`
- تستقبل `?id=xxx&status=xxx` من Moyasar redirect
- تستدعي edge function `moyasar-verify-payment` للتحقق
- عند النجاح: تمسح السلة وتنقل لـ `/payment-success`
- عند الفشل: تعرض رسالة خطأ مع خيار إعادة المحاولة

#### 5. تعديل `src/pages/Checkout.tsx`
- عند اختيار "دفع إلكتروني": بدلاً من إنشاء escrow مباشرة، يستدعي edge function لإنشاء دفعة Moyasar
- يوجه المستخدم إلى `transaction_url` (صفحة 3DS)
- التحويل البنكي يبقى كما هو بدون تغيير

#### 6. تعديل `src/components/donor/DonationPaymentStep.tsx` و `src/pages/Donations.tsx`
- إضافة خيار "دفع إلكتروني" بجانب التحويل البنكي في صفحة المنح
- عند اختياره: نفس التدفق (edge function → Moyasar → callback → verify)

#### 7. تعديل `src/App.tsx`
- إضافة route `/payment-callback` → `PaymentCallback`

#### 8. تعديل `supabase/config.toml`
- إضافة تسجيل الـ edge functions الجديدة مع `verify_jwt = false`

### ملاحظات أمنية
- Publishable Key آمن للفرونت إند (محدود بعملية Create Payment فقط)
- Secret Key يُستخدم فقط في edge functions (لا يُكشف أبداً للمستخدم)
- التحقق من الدفع يتم في الباكند (edge function) وليس الفرونت إند
- يتم التحقق من المبلغ والعملة والحالة قبل إنشاء الضمان المالي

### ملفات متأثرة

| الملف | التغيير |
|-------|---------|
| `supabase/functions/moyasar-create-payment/index.ts` | جديد — إنشاء دفعة Moyasar |
| `supabase/functions/moyasar-verify-payment/index.ts` | جديد — التحقق من الدفع |
| `src/pages/PaymentCallback.tsx` | جديد — صفحة استقبال callback |
| `src/pages/Checkout.tsx` | تعديل الدفع الإلكتروني لاستخدام Moyasar |
| `src/pages/Donations.tsx` | إضافة خيار الدفع الإلكتروني |
| `src/components/donor/DonationPaymentStep.tsx` | إضافة خيار الدفع الإلكتروني |
| `src/App.tsx` | إضافة route جديد |
| `supabase/config.toml` | تسجيل edge functions |

