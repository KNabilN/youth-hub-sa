
# مراجعة تنفيذ سلة المحذوفات - العناصر المفقودة

## ما تم تنفيذه بنجاح:
- قاعدة البيانات: اعمدة `deleted_at` + دالة `purge_soft_deleted_records`
- Hook سلة المحذوفات (`useTrash.ts`) مع جميع العمليات
- صفحة سلة المحذوفات (`Trash.tsx`) مع التبويبات والتأكيدات
- Soft delete في: `useMyServices`, `useAdminServices`, `usePortfolio`
- فلتر `deleted_at` في: `useMyServices`, `useProjects`, `useSupportTickets`, `usePortfolio`, `useAdminServices`, `useProjectStats`
- رسائل التأكيد المحدثة في: `MyServices.tsx`, `ServiceApprovalCard.tsx`
- رابط سلة المحذوفات في الـ Sidebar
- Route `/trash` مسجل في `App.tsx`

---

## العناصر المفقودة التي تحتاج إصلاح:

### 1. فلتر `deleted_at` مفقود من عدة hooks استعلام

هذه الـ hooks تعرض سجلات محذوفة (soft-deleted) للمستخدمين لأنها لا تحتوي على فلتر `.is("deleted_at", null)`:

- **`src/hooks/useMyDisputes.ts`** - يعرض شكاوى محذوفة للمستخدم
- **`src/hooks/useAdminDisputes.ts`** - يعرض شكاوى محذوفة للمدير
- **`src/hooks/useAdminTickets.ts`** - يعرض تذاكر محذوفة للمدير
- **`src/hooks/useAdminProjects.ts`** - يعرض طلبات محذوفة للمدير
- **`src/hooks/useAvailableProjects.ts`** - يعرض طلبات محذوفة لمقدمي الخدمات
- **`src/hooks/useMyAssignedProjects.ts`** - يعرض طلبات محذوفة للمقدم المعيّن
- **`src/hooks/useLandingStats.ts`** - يعرض خدمات/طلبات محذوفة في الصفحة الرئيسية (الاستعلامات المميزة)
- **`src/hooks/useServiceDetail.ts`** - قد يعرض خدمة محذوفة في صفحة التفصيل

### 2. رسالة التأكيد في PortfolioManager لم تُحدّث

`src/components/portfolio/PortfolioManager.tsx` - عند حذف عمل من المعرض، يتم الحذف بدون أي رسالة تأكيد أصلاً (لا dialog). الـ toast يقول فقط "تم حذف العمل" بدون ذكر أنه نُقل للسلة.

### 3. لا يوجد delete button/action لبعض الكيانات

الخطة تشمل soft delete للطلبات والتذاكر والشكاوى، لكن لا يوجد في الواجهة أزرار حذف لهذه الكيانات حالياً. هذا يعني أن المستخدم لا يستطيع حذفها أصلاً (soft أو hard). هذه ليست مشكلة وظيفية لكن تعني أن سلة المحذوفات ستكون فارغة لهذه الأنواع.

---

## خطة الإصلاح

### الملفات المتأثرة:

| ملف | التغيير |
|-----|---------|
| `src/hooks/useMyDisputes.ts` | اضافة `.is("deleted_at", null)` |
| `src/hooks/useAdminDisputes.ts` | اضافة `.is("deleted_at", null)` |
| `src/hooks/useAdminTickets.ts` | اضافة `.is("deleted_at", null)` |
| `src/hooks/useAdminProjects.ts` | اضافة `.is("deleted_at", null)` |
| `src/hooks/useAvailableProjects.ts` | اضافة `.is("deleted_at", null)` |
| `src/hooks/useMyAssignedProjects.ts` | اضافة `.is("deleted_at", null)` |
| `src/hooks/useLandingStats.ts` | اضافة `.is("deleted_at", null)` للاستعلامات المميزة |
| `src/hooks/useServiceDetail.ts` | اضافة فحص `deleted_at` اختياري |
| `src/components/portfolio/PortfolioManager.tsx` | تحديث toast ليذكر سلة المحذوفات |

كل التغييرات بسيطة - اضافة سطر `.is("deleted_at", null)` في كل استعلام.
