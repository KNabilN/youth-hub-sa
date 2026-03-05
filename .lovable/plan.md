

## خطة: إصلاح دمج بوابة Moyasar — استخدام نموذج الدفع الرسمي

### المشكلة الحالية

التنفيذ الحالي **لن يعمل** لأن Edge Function `moyasar-create-payment` ترسل `source: { type: "creditcard" }` بدون بيانات البطاقة (رقم، اسم، تاريخ انتهاء، CVC). Moyasar API ترفض هذا الطلب.

### الحل الصحيح

استخدام **مكتبة Moyasar JavaScript الرسمية** (`Moyasar.init()`) التي تعرض نموذج دفع جاهز وآمن يتعامل مع:
- إدخال بيانات البطاقة بشكل آمن (PCI compliant)
- التحقق ثلاثي الأبعاد (3DS) تلقائياً
- إعادة التوجيه للـ callback_url بعد الدفع

```text
التدفق الصحيح:
المستخدم → صفحة الدفع (نموذج Moyasar.init) → 3DS → callback_url
  ↓
/payment-callback?id=xxx&status=paid
  ↓
Edge Function: moyasar-verify-payment (secret key) → تأكيد
  ↓
إنشاء escrow + مسح السلة → /payment-success
```

### التغييرات

#### 1. حذف Edge Function `moyasar-create-payment`
لم تعد مطلوبة — الدفع يتم مباشرة من الفرونت إند عبر Publishable Key

#### 2. إنشاء مكون `src/components/payment/MoyasarPaymentForm.tsx`
- يحمّل مكتبة Moyasar JS (`https://cdn.moyasar.com/mpf/1.14.0/moyasar.js` + CSS)
- يستدعي `Moyasar.init()` مع:
  - `publishable_api_key`: يُجلب من Edge Function صغيرة أو متغير بيئة `VITE_MOYASAR_PUBLISHABLE_KEY`
  - `amount` بالهللات
  - `callback_url` = `/payment-callback`
  - `methods: ['creditcard']`
  - `supported_networks: ['visa', 'mastercard', 'mada']`
- يعرض نموذج بطاقة الدفع المضمن

#### 3. إنشاء Edge Function `moyasar-get-publishable-key`
- ترجع الـ Publishable Key فقط (لتجنب وضعه في الكود المصدري)
- أو بديلاً: إضافة `VITE_MOYASAR_PUBLISHABLE_KEY` كمتغير بيئة عام (الطريقة الأبسط حيث أن Publishable Key آمن للعرض)

#### 4. تعديل `src/pages/Checkout.tsx`
- عند اختيار "دفع إلكتروني": بدلاً من استدعاء edge function، يعرض مكون `MoyasarPaymentForm`
- يحفظ السياق في `sessionStorage` قبل عرض النموذج

#### 5. تعديل `src/pages/Donations.tsx`
- نفس التغيير: عرض `MoyasarPaymentForm` بدلاً من استدعاء edge function

#### 6. تعديل `src/components/donor/DonationPaymentStep.tsx`
- إضافة prop للمكون `MoyasarPaymentForm` عند اختيار الدفع الإلكتروني

#### 7. الإبقاء على `moyasar-verify-payment` Edge Function
- تبقى كما هي للتحقق من الدفع في الباكند بعد الـ callback

#### 8. تعديل `supabase/config.toml`
- إضافة `verify_jwt = false` للـ edge functions المطلوبة

#### 9. إضافة `VITE_MOYASAR_PUBLISHABLE_KEY` في `.env`
- Publishable Key آمن للفرونت إند (هذا تصميم Moyasar الرسمي)

### ملفات متأثرة

| الملف | التغيير |
|-------|---------|
| `supabase/functions/moyasar-create-payment/index.ts` | **حذف** — لم تعد مطلوبة |
| `src/components/payment/MoyasarPaymentForm.tsx` | **جديد** — مكون نموذج Moyasar |
| `src/pages/Checkout.tsx` | تعديل — عرض MoyasarPaymentForm |
| `src/pages/Donations.tsx` | تعديل — عرض MoyasarPaymentForm |
| `src/components/donor/DonationPaymentStep.tsx` | تعديل — دمج نموذج الدفع |
| `src/pages/PaymentCallback.tsx` | يبقى كما هو |
| `supabase/functions/moyasar-verify-payment/index.ts` | يبقى + إضافة في config.toml |
| `supabase/config.toml` | إضافة تسجيل moyasar-verify-payment |
| `index.html` | إضافة Moyasar CSS/JS |

