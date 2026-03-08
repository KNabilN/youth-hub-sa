

# إصلاح مشكلة تسجيل المشروع مرتين عند شراء خدمة

## السبب الجذري
عند استخدام **الدفع المختلط** (رصيد منح + دفع إلكتروني)، يحدث التالي:
1. كود `Checkout.tsx` (سطر 99-145) يُنشئ المشروع والعقد والعرض **أثناء خصم المنح**
2. ثم يمرر `skip_project_creation: true` في سياق الدفع
3. لكن دالة `processCheckout` في Edge Function **لا تتحقق** من هذا العلم وتُنشئ كل شيء مرة ثانية!

## الحل
في `supabase/functions/moyasar-verify-payment/index.ts` → دالة `processCheckout`:
- إضافة تحقق من `ctx.skip_project_creation` — إذا كان `true`، يتم تخطي إنشاء المشروع والعقد والعرض، ويتم فقط إنشاء سجل الضمان المالي والفاتورة

### الملف المتأثر:
- `supabase/functions/moyasar-verify-payment/index.ts` (دالة `processCheckout` سطر 204-332)

