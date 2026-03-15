

# إصلاح نموذج الدفع Moyasar — عالق على "Loading"

## السبب الجذري
النظام يستخدم إصدار قديم من Moyasar SDK (`1.14.0` من `cdn.moyasar.com`) بينما التوثيق الرسمي يوصي بالإصدار **2.2.7** من jsDelivr. الإصدار القديم يتسبب في توقف النموذج على "Loading".

## التغييرات

### 1. `src/components/payment/MoyasarPaymentForm.tsx`
- تحديث روابط CDN من:
  - `https://cdn.moyasar.com/mpf/1.14.0/moyasar.css`
  - `https://cdn.moyasar.com/mpf/1.14.0/moyasar.js`
- إلى الإصدار الرسمي الموصى به:
  - `https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.7/dist/moyasar.css`
  - `https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.7/dist/moyasar.umd.min.js`

### 2. `src/pages/Donations.tsx` (إصلاح الـ Stepper)
- تعديل شرط الـ stepper ليأخذ `step === "moyasar"` بالاعتبار:
  - `currentStep={step === "form" ? 0 : step === "payment" || step === "moyasar" ? 1 : 2}`
- حالياً عند عرض نموذج Moyasar يظهر الـ stepper على الخطوة 3 (التأكيد) بدلاً من الخطوة 2 (الدفع)

