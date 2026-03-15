

# إصلاح خطأ `request_payload: null` في Moyasar

## المشكلة
مكتبة Moyasar MPF لا تدعم تمرير عنصر DOM مباشرة عبر `element: container`. تتطلب **مُحدد CSS نصي** (CSS selector string) مثل `".moyasar-form"` أو `"#myform"`. تمرير DOM node يجعل المكتبة تفشل صامتاً وترسل `request_payload: null`.

## الحل
استخدام مُحدد CSS ثابت بدلاً من DOM node مباشرة.

## التغييرات

### `src/components/payment/MoyasarPaymentForm.tsx`
- إضافة `id` ثابت وفريد على `div` الحاوية (مثل `moyasar-payment-container`)
- تغيير `element: container` إلى `element: "#moyasar-payment-container"` (مُحدد CSS نصي)
- الإبقاء على `requestAnimationFrame` و `container.innerHTML = ""` لضمان الاستقرار

```text
Before:  element: container        // DOM node — لا يعمل مع Moyasar
After:   element: ".moyasar-form"  // CSS selector — يعمل مع Moyasar
```

- استخدام class selector `.moyasar-form` (كما في الذاكرة التقنية) بإضافة `className="moyasar-form"` على الحاوية

