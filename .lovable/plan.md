

# إصلاح حفظ رقم الصفحة عند العودة من التفاصيل

## المشكلة
الـ hook يحفظ فقط `scrollY` لكن لا يحفظ **رقم الصفحة**. عند العودة، الـ pagination يبدأ من الصفحة 0 دائماً.

## الحل
إضافة `page` إلى البيانات المحفوظة في `sessionStorage`، وإعادة ضبط الصفحة عند العودة.

### 1. تحديث `src/hooks/useListHighlight.ts`
- إضافة `page` إلى `HighlightData`
- تعديل `saveAndNavigate` ليقبل `page` كمعامل إضافي
- إضافة `restorePage` — يقرأ الصفحة المحفوظة ويعيدها عبر callback
- تأخير التظليل أكثر (300ms) لانتظار تحميل البيانات بعد تغيير الصفحة

### 2. تحديث `src/hooks/usePagination.ts`
- قراءة الصفحة الأولية من `sessionStorage` إذا كانت موجودة (بدلاً من 0 دائماً)
- يقبل `listKey` اختياري لمطابقة البيانات المحفوظة

### 3. تحديث صفحات القوائم (5 ملفات)
- `UserTable.tsx` — تمرير `pagination.page` إلى `saveAndNavigate`
- `AdminProjects.tsx` — نفس التعديل
- `AdminServices.tsx` — نفس التعديل
- `AdminTickets.tsx` — نفس التعديل
- `AdminDisputes.tsx` — نفس التعديل

### 4. تحديث صفحات الأباء التي تنشئ pagination
- `AdminUsers.tsx` — تمرير `listKey` إلى `usePagination`
- وكذلك بقية الصفحات

### النهج المبسط
بدلاً من تعقيد كل الصفحات، الأسهل هو جعل `usePagination` يقرأ الصفحة المحفوظة من `sessionStorage` مباشرة:
- `useListHighlight` يحفظ `page` مع البيانات
- `usePagination(listKey)` يقرأ الصفحة الأولية من نفس الـ storage key

### الملفات المتأثرة
- `src/hooks/useListHighlight.ts`
- `src/hooks/usePagination.ts`
- `src/components/admin/UserTable.tsx`
- `src/pages/admin/AdminUsers.tsx`
- `src/pages/admin/AdminProjects.tsx`
- `src/pages/admin/AdminServices.tsx`
- `src/pages/admin/AdminTickets.tsx`
- `src/pages/admin/AdminDisputes.tsx`

