

# تأكيد أن الصورة الأساسية للخدمة هي صورة التصنيف (fallback)

## المشكلة
بعض الأماكن في المنصة لا تعرض صورة التصنيف كصورة افتراضية عندما لا تملك الخدمة صورة خاصة بها.

## الأماكن التي تحتاج إصلاح

| الملف | المشكلة | الإصلاح |
|-------|---------|---------|
| `src/components/landing/LandingServicesGrid.tsx` | الاستعلام يجلب `categories(name)` فقط، والعرض يتحقق من `s.image_url` فقط | تغيير الاستعلام لجلب `categories(name, image_url)` وتعديل العرض ليستخدم `s.image_url \|\| s.category?.image_url` |
| `src/hooks/useLandingStats.ts` | نفس المشكلة — `categories(name)` فقط | تغيير لـ `categories(name, image_url)` |
| `src/components/admin/ServiceApprovalCard.tsx` | يعرض `service.image_url` فقط | إضافة fallback لـ `service.categories?.image_url` |
| `src/pages/admin/AdminServiceDetail.tsx` | يمرر `service.image_url` فقط للـ Gallery | إضافة fallback لـ `service.categories?.image_url` |

## الأماكن التي تعمل بشكل صحيح (لا تحتاج تعديل)
- `ServiceCard.tsx` — يستخدم `service.image_url || categories?.image_url` ✓
- `ServiceDetail.tsx` — يستخدم `service.image_url || categories?.image_url` ✓
- `Marketplace.tsx` — يجلب `categories(*)` بالكامل ✓

## التغييرات التفصيلية

### 1. `LandingServicesGrid.tsx`
- تحديث الـ interface ليشمل `image_url` في category
- تعديل سطر 102-106 ليعرض صورة التصنيف كـ fallback
- تحديث استعلامي الـ fetch (سطر 75) لجلب `image_url` مع `name`

### 2. `useLandingStats.ts`
- تعديل استعلامات الخدمات لتجلب `categories(name, image_url)` بدلاً من `categories(name)`

### 3. `ServiceApprovalCard.tsx`
- تعديل سطر 112 من `service.image_url` إلى `service.image_url || service.categories?.image_url`

### 4. `AdminServiceDetail.tsx`
- تعديل سطر 118 من `service.image_url` إلى `service.image_url || (service.categories as any)?.image_url`

## النتيجة
كل مكان يعرض خدمة سيظهر صورة التصنيف تلقائياً إذا لم يكن للخدمة صورة خاصة.

