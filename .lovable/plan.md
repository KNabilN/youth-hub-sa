

# تعديل زر "قدّم عرضك" ليتغير حسب دور المستخدم

## الفكرة
- **غير مسجل**: الزر يعمل ويوجه لصفحة التسجيل — "سجّل لتقديم عرضك"
- **مزود خدمة**: الزر يعمل ويوجه لصفحة المشروع — "قدّم عرضك"
- **مانح**: الزر يعمل ويوجه لصفحة المنح — "قدّم منحة"
- **جمعية / أدمن**: الزر معطل (disabled)

## التغييرات

### 1. `src/pages/Index.tsx`
- تمرير `role` إلى `LandingRequestsTable` بجانب `isLoggedIn`

### 2. `src/components/landing/LandingRequestsTable.tsx`
- إضافة prop `role` من نوع `string | null`
- تعديل زر "قدّم عرضك" في كل بطاقة:
  - `role === 'donor'` → نص "قدّم منحة" + رابط لصفحة المنح (`/donations`)
  - `role === 'youth_association' || role === 'super_admin'` → الزر معطل `disabled`
  - `role === 'service_provider'` → "قدّم عرضك" + رابط لصفحة المشروع
  - غير مسجل → "سجّل لتقديم عرضك" + رابط `/auth?mode=register`
- نفس المنطق للزر السفلي "عرض جميع الطلبات"

### الملفات المتأثرة:
- `src/pages/Index.tsx`
- `src/components/landing/LandingRequestsTable.tsx`

