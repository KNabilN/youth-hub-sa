

# إصلاح null payload في Moyasar

## السبب
السطر 307: `style={{ display: formReady ? "block" : "none" }}` — عند استدعاء `Moyasar.init` تكون `formReady = false` فالحاوية مخفية بـ `display: none`. الـ SDK لا يستطيع حساب أبعاد النموذج أو رسم الـ iframe في عنصر مخفي، فيرسل `request_payload: null`.

## الحل
إعادة كتابة المكون بشكل مبسط كما في الخطة الأصلية:

### `src/components/payment/MoyasarPaymentForm.tsx`
- الحاوية تكون **دائماً مرئية** (`display: block`)
- الـ loader يظهر فوقها كـ overlay ثم يختفي بعد التهيئة
- استخدام `id` ثابت (`moyasar-payment-container`) بدلاً من معرف عشوائي
- إزالة كل المنطق المعقد (MutationObserver, retries, cleanupRef, containerRef)
- `setTimeout(150ms)` بسيط قبل `Moyasar.init`
- `isInitialized` ref لمنع التهيئة المتكررة

```text
┌─────────────────────────┐
│  div (always visible)   │
│  id="moyasar-payment-   │
│  container"             │
│                         │
│  ┌───────────────────┐  │
│  │ Loader (absolute) │  │  ← يختفي بعد init
│  └───────────────────┘  │
│                         │
│  [Moyasar injects here] │  ← SDK يرسم هنا
└─────────────────────────┘
```

### التغيير الجوهري
- **قبل**: `display: none` → SDK يفشل → `null payload`
- **بعد**: دائماً مرئي → SDK يرسم بنجاح → payload صحيح

