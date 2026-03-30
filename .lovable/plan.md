

# إصلاح البحث ليشمل جميع البيانات وليس الصفحة الحالية فقط

## المشكلة
في صفحتين (إدارة الطلبات وإدارة المستخدمين)، يتم جلب صفحة واحدة فقط من قاعدة البيانات عبر `.range(from, to)` ثم يُطبَّق البحث على هذه الصفحة فقط. باقي الصفحات (السوق، المشاريع المتاحة، الخدمات) تعمل بشكل سليم لأنها إما تجلب كل البيانات أو تستخدم بحث على مستوى قاعدة البيانات.

## الحل
إضافة بحث على مستوى قاعدة البيانات (server-side search) عبر `.ilike` في الصفحتين المتأثرتين.

## التغييرات

### 1. `src/hooks/useAdminProjects.ts`
- إضافة parameter `search?: string` لـ `useAdminProjects`
- عند وجود نص بحث: إضافة `.or("title.ilike.%search%,request_number.ilike.%search%")` للاستعلام
- إضافة `search` لـ `queryKey`
- تعديل `useAdminProjectsCount` لقبول `search` أيضاً وتطبيق نفس الفلتر

### 2. `src/pages/admin/AdminProjects.tsx`
- تمرير `search` من الـ state إلى `useAdminProjects` و `useAdminProjectsCount`
- إزالة فلترة البحث النصي من `filtered` (إبقاء فلاتر الحالة والتصنيف على مستوى العميل لأنها تعمل مع البيانات المجلوبة)
- إضافة `resetPage` عند تغيير البحث
- **ملاحظة**: فلاتر الحالة والتصنيف تحتاج أيضاً نقلها للسيرفر لنفس السبب

### 3. `src/hooks/useAdminUsers.ts`
- إضافة `search?: string` لواجهة `AdminUsersFilters`
- عند وجود نص بحث: إضافة `.or("full_name.ilike.%search%,organization_name.ilike.%search%,user_number.ilike.%search%")` للاستعلام
- إضافة `search` لـ `queryKey`
- تعديل `useAdminUsersCount` لقبول `search` أيضاً

### 4. `src/components/admin/UserTable.tsx`
- تمرير `search` ضمن `filters` بدلاً من الفلترة المحلية
- إزالة `filtered` والاعتماد مباشرة على `users`
- إضافة `resetPage` عند تغيير البحث

### ملفات متأثرة

| الملف | التغيير |
|-------|---------|
| `src/hooks/useAdminProjects.ts` | إضافة بحث server-side + فلاتر |
| `src/pages/admin/AdminProjects.tsx` | تمرير البحث والفلاتر للهوك + resetPage |
| `src/hooks/useAdminUsers.ts` | إضافة بحث server-side |
| `src/components/admin/UserTable.tsx` | تمرير البحث للهوك بدل الفلترة المحلية |

لا تغييرات في قاعدة البيانات.

