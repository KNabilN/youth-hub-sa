

# تقييد المستخدمين غير الموثقين من الإجراءات الحساسة

## المشكلة
حالياً أي مستخدم مسجّل يمكنه تنفيذ كل الإجراءات بغض النظر عن حالة التوثيق (`is_verified`). المطلوب:
- **الجمعيات** غير الموثقة: لا تستطيع شراء خدمات ولا إنشاء طلبات مشاريع
- **المانحون** غير الموثقين: لا يستطيعون التبرع/الدعم
- **مزودو الخدمات** غير الموثقين: لا يستطيعون التقديم على طلبات الجمعيات ولا رفع خدمات جديدة

## الحل
إنشاء hook مركزي `useVerificationGuard` يُستخدم في كل نقطة إجراء لفحص `is_verified` وعرض رسالة تنبيه بدلاً من تنفيذ العملية.

## التغييرات

### 1. إنشاء `src/hooks/useVerificationGuard.ts` (ملف جديد)
- hook بسيط يستقبل الـ `profile` ويعيد دالة `guardAction(callback)`:
  - إذا `is_verified === false`: يعرض `toast.error("يجب توثيق حسابك أولاً...")` ولا ينفذ الـ callback
  - إذا `is_verified === true`: ينفذ الـ callback عادياً
- يُعيد أيضاً `isVerified` boolean للاستخدام في تعطيل الأزرار

### 2. تقييد شراء الخدمات (جمعيات + مانحون)
**`src/pages/ServiceDetail.tsx`**:
- جلب الـ profile، تمرير `isVerified` إلى `canPurchase`
- `canPurchase` يصبح: `(role === "youth_association" || role === "donor") && isVerified`
- عرض تنبيه صغير تحت زر السلة إذا غير موثق

**`src/components/marketplace/ServiceCard.tsx`**:
- نفس التعديل على `canPurchase`

**`src/components/landing/LandingServicesGrid.tsx`**:
- فحص التوثيق قبل إضافة للسلة

**`src/pages/Checkout.tsx`**:
- فحص في بداية الصفحة وعرض تنبيه + منع الاستمرار إذا غير موثق

### 3. تقييد إنشاء طلبات المشاريع (جمعيات)
**`src/pages/ProjectCreate.tsx`**:
- فحص التوثيق عند بداية الصفحة
- عرض تنبيه وتوجيه لصفحة الملف الشخصي إذا غير موثق

### 4. تقييد التبرع (مانحون)
**`src/pages/Donations.tsx`**:
- فحص التوثيق قبل بدء نموذج التبرع
- تعطيل النموذج مع تنبيه

**`src/pages/GrantRequests.tsx`**:
- تعطيل زر "تبرع" إذا غير موثق مع tooltip

### 5. تقييد رفع الخدمات (مزودو خدمات)
**`src/pages/MyServices.tsx`**:
- تعطيل زر "إضافة خدمة" إذا غير موثق
- عرض تنبيه

### 6. تقييد التقديم على طلبات (مزودو خدمات)
**`src/pages/ProjectBidView.tsx`**:
- فحص التوثيق، تعطيل نموذج التقديم مع رسالة تنبيه

**`src/pages/AvailableProjects.tsx`**:
- تعطيل زر "تقديم عرض" في بطاقات المشاريع

### ملخص الملفات

| الملف | العملية |
|-------|---------|
| `src/hooks/useVerificationGuard.ts` | إنشاء جديد |
| `src/pages/ServiceDetail.tsx` | تعديل |
| `src/components/marketplace/ServiceCard.tsx` | تعديل |
| `src/components/landing/LandingServicesGrid.tsx` | تعديل |
| `src/pages/Checkout.tsx` | تعديل |
| `src/pages/ProjectCreate.tsx` | تعديل |
| `src/pages/Donations.tsx` | تعديل |
| `src/pages/GrantRequests.tsx` | تعديل |
| `src/pages/MyServices.tsx` | تعديل |
| `src/pages/ProjectBidView.tsx` | تعديل |
| `src/pages/AvailableProjects.tsx` | تعديل |

لا حاجة لتغييرات في قاعدة البيانات — حقل `is_verified` موجود بالفعل في جدول `profiles`.

