

## المشكلة

في صفحة `PaymentCallback.tsx`، زر "إعادة المحاولة" (سطر 110) يوجّه دائماً إلى `/checkout` بغض النظر عن نوع الدفعة. عندما يكون الدفع لمنحة مباشرة (`type: "donation"`)، يجب أن يعود المستخدم إلى صفحة المنح `/donations` وليس `/checkout`.

## الحل

تعديل `PaymentCallback.tsx` لقراءة `moyasar_payment_context` من `sessionStorage` واستخدام حقل `type` لتحديد وجهة إعادة المحاولة:

- `type === "donation"` → `/donations`
- `type === "checkout"` أو غيره → `/checkout`

### التغيير المطلوب

في `PaymentCallback.tsx`:
1. قراءة `context` من `sessionStorage` في أعلى المكوّن (ليس فقط داخل `useEffect`)
2. تغيير زر "إعادة المحاولة" ليستخدم الوجهة الصحيحة بناءً على `context.type`

