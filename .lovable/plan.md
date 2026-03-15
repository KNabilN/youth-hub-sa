

# إصلاح نموذج Moyasar — السبب الجذري الحقيقي

## المشكلة الفعلية

**React يتحكم بمحتوى الـ div الذي يحقن فيه Moyasar نموذجه.**

الكود الحالي يضع "مؤشر التحميل" (Loader2 + نص) **داخل** نفس الـ `div` الذي يُمرر لـ `Moyasar.init`:

```text
<div id={uniqueId}>          ← Moyasar يحقن هنا
  <Loader2 />                ← React يملك هذا
  <span>جاري التحميل...</span>
</div>
```

عندما يعمل `Moyasar.init`، يمسح المحتوى ويحقن الـ iframes الخاصة به. لكن React لا يعلم بذلك — وفي أي re-render (state change, strict mode) **React يعيد كتابة المحتوى الأصلي (spinner) ويمسح نموذج Moyasar**.

النتيجة: مربع أبيض فارغ.

## الحل

**فصل حاوية Moyasar عن محتوى React تماماً:**

### `src/components/payment/MoyasarPaymentForm.tsx`
- جعل الـ `div` المستهدف لـ Moyasar **فارغاً تماماً** في JSX (بدون أطفال React)
- عرض spinner التحميل **خارج/فوق** حاوية Moyasar، وإخفاؤه بعد نجاح init
- استخدام `useRef` + `useCallback` ref للحصول على العنصر بدلاً من `document.getElementById`
- إضافة state `formReady` يتحول لـ `true` بعد نجاح `Moyasar.init`
- إخفاء حاوية Moyasar بـ `display:none` أثناء التحميل وإظهارها عند `formReady`

```text
البنية الجديدة:
{!formReady && <LoadingSpinner />}     ← React يملك هذا
<div                                    ← Moyasar يملك هذا
  ref={containerRef}
  id={uniqueId}
  style={{ display: formReady ? 'block' : 'none' }}
/>                                      ← فارغ — لا أطفال React
```

- الإبقاء على كل منطق التحميل، الـ retry، والـ error handling الموجود
- الإبقاء على guards (amount > 0, key, callbackUrl)

هذا التغيير يمنع React من لمس محتوى Moyasar نهائياً.

### ملفات أخرى: بدون تعديل
الـ guards في Donations.tsx و Checkout.tsx و BidPaymentDialog.tsx سليمة. المشكلة فقط داخل المكون نفسه.

