

## خطة: إصلاح مشاكل دمج Moyasar لتتمكن من الاختبار

### المشاكل المكتشفة

بعد مراجعة الكود والـ Edge Functions:

#### 1. `btoa` غير متوفر في Deno (moyasar-verify-payment)
- السطر 61: `btoa(MOYASAR_SECRET_KEY + ":")` — في Deno يجب استخدام `btoa` من `std/encoding` أو استخدام `Uint8Array` + `TextEncoder`
- **ملاحظة**: فعلياً `btoa` متوفر في Deno كـ Web API، لذا هذا ليس مشكلة

#### 2. مشكلة `callback_url` في Moyasar
- في `Checkout.tsx` السطر 398: `callback_url` يستخدم `window.location.origin` وهو عنوان preview ديناميكي
- Moyasar يعيد التوجيه لهذا الرابط بعد الدفع، لكن يجب أن يكون ثابتاً ومسجلاً في Moyasar dashboard
- **هذا ليس blocker للاختبار** — يعمل مع test keys

#### 3. مشكلة في `PaymentCallback.tsx` — عدم وجود مصادقة عند العودة
- المستخدم قد يفقد جلسته عند العودة من 3DS redirect (خاصة في sandbox/preview)
- يجب التأكد من وجود جلسة قبل استدعاء `moyasar-verify-payment`

#### 4. `MoyasarPaymentForm.tsx` — مشكلة إعادة التهيئة
- `initializedRef` يمنع إعادة التهيئة حتى عند تغيير المبلغ أو إعادة فتح النموذج
- إذا أغلق المستخدم النموذج وعاد، لن يظهر مرة أخرى

#### 5. مشكلة `getClaims` في Deno
- `supabase.auth.getClaims(token)` قد لا يكون متوفراً في بعض إصدارات supabase-js
- يجب التحقق أو استخدام `getUser()` كبديل

### التغييرات المطلوبة

| الملف | التعديل |
|-------|---------|
| `supabase/functions/moyasar-verify-payment/index.ts` | استبدال `getClaims` بـ `getUser` كبديل آمن |
| `supabase/functions/moyasar-get-config/index.ts` | نفس الإصلاح |
| `src/components/payment/MoyasarPaymentForm.tsx` | إصلاح مشكلة إعادة التهيئة + cleanup |
| `src/pages/PaymentCallback.tsx` | إضافة انتظار الجلسة + معالجة أفضل للأخطاء |

### ملاحظة للاختبار
لاختبار تدفق الدفع يجب:
1. تسجيل الدخول كمانح
2. إضافة خدمة للسلة → الذهاب للدفع → اختيار "دفع إلكتروني"
3. أو الذهاب لصفحة المنح → إنشاء منحة → اختيار "دفع إلكتروني"
4. بيانات الاختبار لـ Moyasar Test: رقم البطاقة `4111111111111111`، أي تاريخ مستقبلي، أي CVC

