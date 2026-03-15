

# خطة إصلاح جذري وشامل لنظام الدفع الإلكتروني (Moyasar)

## المشاكل المُكتشفة

### 1. مشكلة اختفاء نموذج الدفع (الأولوية القصوى)
**السبب الجذري الحقيقي**: `Moyasar.init()` تعمل بشكل **غير متزامن** داخلياً — عند استدعائها تُرجع فوراً (لا ترمي خطأ)، لكنها تحاول لاحقاً البحث عن العنصر في DOM. إذا فشلت تطبع `Element: null is not a valid element` ولا يظهر أي شيء.

الكود الحالي يضبط `formReady = true` فوراً بعد `Moyasar.init()` دون التحقق من أن المكتبة فعلاً حقنت iframe في الحاوية. النتيجة: يُخفى الـ spinner ويظهر صندوق فارغ.

**كما أن** `element: \`#${uniqueId}\`` يعتمد على CSS selector نصي — Moyasar تبحث عنه بـ `document.querySelector` الذي قد يفشل في توقيتات معينة.

### 2. مشكلة أمنية: الأسعار تُحدد من الواجهة
الواجهة (client) تحسب الأسعار والعمولات وتمررها في `context` لـ `moyasar-verify-payment`. الـ Edge Function تثق بهذه القيم دون إعادة حسابها. هذا يسمح نظرياً بالتلاعب بالمبالغ.

### 3. خطأ ref في `DonationTimeline`
خطأ console: `Function components cannot be given refs` — `DonationTimeline` يُمرر لها ref من `TabsContent` لكنها function component بدون `forwardRef`.

---

## خطة الإصلاح

### الملف 1: `src/components/payment/MoyasarPaymentForm.tsx` — إعادة كتابة كاملة

التغييرات:
- **بعد `Moyasar.init()`**: لا نضبط `formReady = true` فوراً. بدلاً من ذلك، نبدأ `MutationObserver` أو `setInterval` قصير يراقب حاوية Moyasar حتى يظهر فيها عنصر فرعي (iframe أو form).
- فقط عند اكتشاف محتوى فعلي نضبط `formReady = true` ونسجل `initKeyRef`.
- إذا لم يظهر محتوى خلال 6 ثوانٍ → `setInitError(true)` مع زر إعادة المحاولة.
- **حذف `el.innerHTML = ""`** — هذا يتصادم مع Moyasar إذا كانت تحاول الحقن. بدلاً من ذلك نتركها فارغة من JSX.
- **الاحتفاظ بـ** `element: \`#${uniqueId}\`` (selector نصي) لأن توثيق Moyasar يدعمه، لكن نضمن أن العنصر موجود في DOM فعلاً قبل الاستدعاء عبر `containerRef.current` check.
- **إضافة console.log** تشخيصي عند كل مرحلة (يُزال لاحقاً).

```text
البنية الجديدة:
{showError && <ErrorUI onRetry={handleRetry} />}
{!showError && !formReady && <LoadingSpinner />}
<div
  ref={containerRef}
  id={uniqueId}
  style={{ display: formReady ? "block" : "none" }}
/>  ← فارغ دائماً — React لا يكتب داخله أبداً

التحقق من النجاح:
Moyasar.init({...})
↓
MutationObserver على containerRef
↓
عند ظهور أول child node → formReady = true
↓
timeout 6s → initError = true
```

### الملف 2: `supabase/functions/moyasar-verify-payment/index.ts` — تحصين أمني

التغييرات:
- بعد جلب `paymentData` من Moyasar API والتأكد أن `status === "paid"`:
  - إعادة حساب الأسعار **سيرفر-سايد** من قاعدة البيانات بدل الثقة بـ `context`.
  - لـ `checkout`: جلب أسعار الخدمات من `micro_services` table.
  - لـ `project_payment`: جلب سعر العرض من `bids` table.
  - لـ `donation`: المبلغ هو ما أدخله المانح — نتحقق أن `paymentData.amount / 100` يطابق الـ total المحسوب.
  - إذا كان الفرق بين المبلغ المدفوع والمبلغ المحسوب أكبر من 1 ريال → رفض العملية وتسجيل log.
- إضافة `commissionRate` من `commission_config` (موجود فعلاً) لحساب `total` الصحيح.
- هذا يمنع أي تلاعب بالأسعار من الواجهة.

### الملف 3: `src/components/donor/DonationTimeline.tsx` — إضافة `forwardRef`

لإصلاح خطأ `Function components cannot be given refs`:
```typescript
export const DonationTimeline = React.forwardRef<HTMLDivElement, DonationTimelineProps>(...)
```

### الملف 4: `src/pages/Donations.tsx` — تحصين mount

- التأكد أن `MoyasarPaymentForm` لا يُعرض إلا عندما `moyasarKey` و `moyasarCallbackUrl` و `amount > 0` كلها جاهزة (موجود فعلاً ✓).
- لا تغييرات جوهرية — الحماية موجودة في السطر 328.

### الملف 5: `src/pages/Checkout.tsx` — تحصين mount

- نفس التحقق — موجود فعلاً في السطر 555 ✓.
- لا تغييرات جوهرية.

### الملف 6: `src/components/bids/BidPaymentDialog.tsx` — تحصين mount

- التحقق موجود في السطر 503 ✓.
- لا تغييرات جوهرية.

---

## ملخص الملفات المتأثرة

| الملف | نوع التعديل |
|-------|------------|
| `src/components/payment/MoyasarPaymentForm.tsx` | إعادة كتابة init logic + MutationObserver |
| `supabase/functions/moyasar-verify-payment/index.ts` | إعادة حساب أسعار سيرفر-سايد |
| `src/components/donor/DonationTimeline.tsx` | إضافة `forwardRef` |

## ما لن يتغير
- قاعدة البيانات — لا حاجة لتعديلات.
- `moyasar-get-config` — سليم.
- `PaymentCallback.tsx` — سليم.
- مسارات الدفع (checkout, donations, bid) — الحماية موجودة.
- نظام callback context (Base64 في URL) — سليم ويعمل.

