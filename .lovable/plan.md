

# إصلاح نموذج الدفع Moyasar — لا يظهر

## المشكلات المكتشفة

### 1. Race condition (السبب الرئيسي)
`Moyasar.init` ينفذ قبل أن يرسم React عنصر DOM بالمعرف الصحيح. عندما يكون السكريبت محملاً مسبقاً، `doInit()` يعمل مباشرة داخل `useEffect` قبل أن يظهر العنصر في الصفحة.

### 2. تحويل مزدوج للمبلغ في Donations.tsx
- `Donations.tsx` يمرر: `Math.round(total * 100)` — أي بالهللات
- `MoyasarPaymentForm` يحول مرة ثانية: `Math.round(amount * 100)`
- النتيجة: مبلغ 100 ريال يصبح 1,000,000 هللة (10,000 ريال!)
- Checkout.tsx و BidPaymentDialog.tsx يمررون بالريال (صحيح)

## التغييرات

### 1. `src/components/payment/MoyasarPaymentForm.tsx`
- استخدام `id` ثابت بسيط بدلاً من `useId()` المعقد
- إضافة `setTimeout(doInit, 150)` لضمان رسم DOM قبل التهيئة
- فصل حاوية Moyasar عن محتوى React (الـ loader في div منفصل يختفي بعد التهيئة)
- إضافة حالة خطأ مع زر إعادة المحاولة
- الإبقاء على تحويل المبلغ من ريال إلى هللات داخل المكون (كما هو)

### 2. `src/pages/Donations.tsx` (سطر 360)
- إزالة `* 100` المزدوج — تمرير `pricing.total` مباشرة بالريال مثل باقي الاستخدامات

