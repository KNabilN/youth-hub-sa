

# إصلاح عدم ظهور نموذج الدفع (Moyasar)

## المشكلة
عند الوصول لخطوة الدفع، يظهر النموذج فارغاً مع خطأ `Element: null is not a valid element` من مكتبة Moyasar. السبب: بعد `container.innerHTML = ""` ثم استدعاء `Moyasar.init({ element: "#formId" })` — المكتبة تبحث بالمُحدد CSS ولا تجد العنصر (خاصة في حالات إعادة الرسم أو Strict Mode).

## الحل
تمرير عنصر DOM مباشرة بدلاً من مُحدد CSS، مما يضمن العثور على العنصر دائماً.

## التغييرات

### `src/components/payment/MoyasarPaymentForm.tsx`
- تغيير `element: "#${formId}"` إلى `element: container` (تمرير DOM node مباشرة)
- حذف `useId` و `formId` حيث لم تعد هناك حاجة لهما
- إضافة تأخير قصير (`requestAnimationFrame`) قبل `doInit` لضمان أن DOM مستقر بعد تصفير innerHTML
- إضافة حماية `try-catch` حول `Moyasar.init` لمنع أخطاء غير معالجة

