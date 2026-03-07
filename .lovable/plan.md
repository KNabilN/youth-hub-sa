

## خطة: إصلاح اختفاء زر الدفع + عرض اسم الجمعية بدل المنطقة

---

### المشكلة 1: اختفاء زر الدفع عند العودة من شاشة الدفع

**تحليل السبب الجذري:**

في `BidPaymentDialog.tsx`، عند اختيار "دفع إلكتروني"، يتم استدعاء `acceptBid.mutateAsync()` **أولاً** (سطر 86) قبل عرض نموذج Moyasar. هذا يؤدي إلى:
1. تغيير حالة العرض إلى `accepted` 
2. رفض جميع العروض الأخرى
3. تعيين `assigned_provider_id` و `budget` في المشروع

إذا أغلق المستخدم النافذة أو رجع قبل إتمام الدفع، لا يمكنه إعادة فتح نموذج الدفع لأن العرض لم يعد بحالة `pending` وزر القبول اختفى.

**الملاحظة:** بانر "بانتظار إتمام الدفع" (سطر 406 في `ProjectDetails.tsx`) يظهر بالفعل ولكنه **لا يحتوي على زر لبدء الدفع**.

**الحل:**

1. **`src/pages/ProjectDetails.tsx`** — تعديل بانر "بانتظار إتمام الدفع" ليتضمن زر "متابعة الدفع" يفتح `BidPaymentDialog` مع بيانات العرض المقبول:
   - إضافة state لفتح dialog الدفع
   - جلب بيانات العرض المقبول (bid مع status=accepted) عبر استعلام إضافي
   - عرض `BidPaymentDialog` مع خاصية جديدة `skipAcceptBid` لتجاوز خطوة قبول العرض (لأنه مقبول بالفعل)

2. **`src/components/bids/BidPaymentDialog.tsx`** — إضافة prop `skipAcceptBid?: boolean`:
   - إذا `true`، تتخطى استدعاء `acceptBid.mutateAsync()` في جميع مسارات الدفع (electronic, bank, grant, mixed)
   - تنتقل مباشرة لخطوة الدفع

3. **نفس المنطق في `Checkout.tsx`** — عند الرجوع من Moyasar وفشل الدفع أو إلغائه، يبقى المستخدم في صفحة Checkout ويمكنه إعادة المحاولة لأن السلة لم تُمسح بعد. (هذا يعمل بالفعل بشكل صحيح)

---

### المشكلة 2: ظهور المنطقة بدل اسم الجمعية

**تحليل السبب الجذري:**

في `DashboardLayout.tsx` سطر 118:
```tsx
{profile?.full_name || user?.email}
```
للجمعيات، يُعرض `full_name` (اسم مسؤول التواصل) بدلاً من `organization_name` (اسم الجمعية). كما أن `ProviderProjectCard` يعرض `profiles.organization_name || profiles.full_name` وهذا صحيح، لكن إذا كان `organization_name` فارغاً يُعرض `full_name`.

الأماكن التي تحتاج مراجعة:
- **Header** في `DashboardLayout.tsx`: يجب أن يعرض `organization_name` أولاً للجمعيات
- **`get_public_profile` DB function**: لا تُرجع `region_id` ولا اسم المنطقة — لكن المشكلة ليست هنا
- **`Profile.tsx`**: يعرض البيانات بشكل صحيح في التعديل

**الحل:**

1. **`src/components/DashboardLayout.tsx`** — تعديل عرض اسم المستخدم:
   ```tsx
   {profile?.organization_name || profile?.full_name || user?.email}
   ```

2. **`src/components/AppSidebar.tsx`** — إذا كان هناك عرض للاسم في السايدبار، نفس التعديل

3. **مراجعة شاملة لكل مكان يُعرض فيه اسم الجمعية** — التأكد من أن `organization_name` يُعرض أولاً:
   - `BidCard.tsx` — عرض اسم صاحب المشروع
   - `ProjectCard.tsx` — إذا يعرض اسم الجمعية

---

### ملخص الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `src/pages/ProjectDetails.tsx` | إضافة زر "متابعة الدفع" في بانر الانتظار + جلب العرض المقبول |
| `src/components/bids/BidPaymentDialog.tsx` | إضافة prop `skipAcceptBid` لتجاوز خطوة القبول |
| `src/components/DashboardLayout.tsx` | إصلاح عرض `organization_name` أولاً في الهيدر |

