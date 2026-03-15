
### التشخيص الحالي (من الكود + الشبكة)
- عندي دليل من Network أن الطلب الفعلي إلى Moyasar **ليس null**:
  - `POST /v1/payments` رجع `201`
  - الـ body يحتوي `amount`, `currency`, `description`, `callback_url`, `metadata`, و`source`.
- كذلك الجلسة وصلت `payment-callback?status=paid` وتم تنفيذ التحقق والنجاح.
- لذلك قيمة `request_payload: null` التي تراها غالبًا من سجل البوابة نفسه (تمثيل/إخفاء) وليست بالضرورة payload الحقيقي المرسل من المتصفح.

### خطة التنفيذ المقترحة (لتثبيت السلوك وإزالة الالتباس)
1. **تقوية تهيئة نموذج Moyasar**
   - في `MoyasarPaymentForm.tsx` إضافة callbacks رسمية:
     - `on_initiating` لإرجاع القيم النهائية (`amount`, `description`, `callback_url`, `metadata`) لحظة الضغط على الدفع.
     - `on_completed` لالتقاط `payment.id` و`status`.
     - `on_failure` لعرض سبب الفشل الحقيقي للمستخدم بدل رسائل عامة.
   - الهدف: منع أي إرسال بقيم ناقصة بسبب حالة React قديمة أو سباق توقيت.

2. **إضافة تتبع تشخيصي آمن (بدون بيانات بطاقة)**
   - توليد `trace_id` وإرساله داخل `metadata` في كل مسار دفع (donation / checkout / project payment).
   - تسجيل `trace_id + payment_id + status` فقط في التحقق (`moyasar-verify-payment`) لتسهيل مطابقة السجلات بين الواجهة والبوابة.

3. **إصلاح UI غير متعلق بالمشكلة لكنه ما زال قائم**
   - في `Donations.tsx` تعديل Stepper ليعتبر `step === "moyasar"` ضمن خطوة “الدفع” بدل “التأكيد”.

4. **تحقق نهائي End-to-End**
   - اختبار 3 مسارات الدفع (منحة / سلة / مشروع).
   - التأكد من:
     - إنشاء طلب `/v1/payments` مع body فعلي.
     - عودة `status=paid`.
     - نجاح `moyasar-verify-payment`.
     - إنشاء السجلات المالية (escrow + invoice) كما هو متوقع.

### تفاصيل تقنية مختصرة
- لا تغييرات قاعدة بيانات مطلوبة.
- لا تغييرات صلاحيات أو RLS مطلوبة.
- كل التعديلات ستكون في:
  - `src/components/payment/MoyasarPaymentForm.tsx`
  - `src/pages/Donations.tsx`
  - (اختياري للتتبع) `supabase/functions/moyasar-verify-payment/index.ts`
