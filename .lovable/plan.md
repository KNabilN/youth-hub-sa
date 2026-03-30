

# إضافة "صفحة X من Y" لجميع قوائم البيانات

## المشكلة
حالياً يظهر فقط "صفحة 1" بدون معرفة العدد الإجمالي للصفحات.

## الحل

### 1. تعديل `PaginationControls.tsx`
- إضافة prop اختياري `totalItems?: number`
- عند توفره: عرض `صفحة X من Y` (حيث Y = Math.ceil(totalItems / pageSize))
- عند عدم توفره: عرض `صفحة X` كما هو (fallback)
- تحسين منطق `hasNext`: إذا توفر `totalItems` يُحسب من العدد الفعلي بدلاً من تخمين `totalFetched === pageSize`

### 2. الصفحات التي تملك البيانات كاملة (تمرير totalItems مباشرة)
هذه الصفحات تحمّل كل البيانات وتقطّعها محلياً — نمرر العدد الإجمالي:

| الصفحة | مصدر العدد |
|--------|-----------|
| `Projects.tsx` | `filtered.length` |
| `MyGrants.tsx` | `filtered.length` |
| `ReceivedGrants.tsx` | `filtered.length` |
| `AdminServices.tsx` | `allFiltered.length` أو المصفوفة قبل التقطيع |
| `AdminDisputes.tsx` | المصفوفة قبل التقطيع |
| `AdminTickets.tsx` | المصفوفة قبل التقطيع |
| `AdminContracts.tsx` | المصفوفة قبل التقطيع |

### 3. الصفحات التي تستخدم server-side pagination (تحتاج count query)
هذه تجلب صفحة واحدة فقط — نحتاج استعلام `count` إضافي:

| الصفحة | Hook المستخدم | التعديل |
|--------|--------------|---------|
| `Marketplace.tsx` | `useAdminServices` (بفلاتر) | إضافة count query |
| `AdminProjects.tsx` | `useAdminProjects` | إضافة count query |
| `UserTable.tsx` | `useAdminUsers` | إضافة count query |
| `AvailableProjects.tsx` | `useAvailableProjects` | إضافة count query |
| `MyBids.tsx` | `useProviderBids` | إضافة count query |

**طريقة الـ count**: استخدام `supabase.from(table).select('*', { count: 'exact', head: true })` مع نفس الفلاتر — يرجع العدد بدون جلب البيانات.

### ملفات متأثرة

| الملف | العملية |
|-------|---------|
| `src/components/PaginationControls.tsx` | تعديل — إضافة `totalItems` prop |
| `src/pages/Projects.tsx` | تمرير `totalItems` |
| `src/pages/MyGrants.tsx` | تمرير `totalItems` |
| `src/pages/ReceivedGrants.tsx` | تمرير `totalItems` |
| `src/pages/admin/AdminServices.tsx` | تمرير `totalItems` |
| `src/pages/admin/AdminDisputes.tsx` | تمرير `totalItems` |
| `src/pages/admin/AdminTickets.tsx` | تمرير `totalItems` |
| `src/pages/admin/AdminContracts.tsx` | تمرير `totalItems` |
| `src/hooks/useAdminUsers.ts` | إضافة count query منفصل |
| `src/hooks/useAdminProjects.ts` | إضافة count query |
| `src/hooks/useAvailableProjects.ts` | إضافة count query |
| `src/hooks/useProviderBids.ts` | إضافة count query |
| `src/hooks/useAdminServices.ts` (Marketplace) | إضافة count query |
| `src/components/admin/UserTable.tsx` | تمرير `totalItems` |
| `src/pages/Marketplace.tsx` | تمرير `totalItems` |
| `src/pages/admin/AdminProjects.tsx` | تمرير `totalItems` |
| `src/pages/AvailableProjects.tsx` | تمرير `totalItems` |
| `src/pages/MyBids.tsx` | تمرير `totalItems` |

لا تغييرات في قاعدة البيانات.

