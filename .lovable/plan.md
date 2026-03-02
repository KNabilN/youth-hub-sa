

# حذف زر ووظيفة الأرشفة من جميع الصفحات

## الملخص
إزالة جميع أزرار الأرشفة والدوال المرتبطة بها من المنصة بالكامل، مع الحفاظ على عرض الحالة "مؤرشف" كتسمية فقط (للسجلات الموجودة مسبقاً).

---

## التغييرات المطلوبة

### 1. `src/components/services/MyServiceCard.tsx`
- حذف `Archive` من imports
- حذف prop `onArchive` من الواجهة والمكوّن
- حذف زر الأرشفة من JSX

### 2. `src/components/projects/ProjectCard.tsx`
- حذف `Archive` من imports
- حذف prop `onArchive` من الواجهة والمكوّن
- حذف زر الأرشفة من JSX

### 3. `src/pages/MyServices.tsx`
- حذف `onArchive` من استدعاء `MyServiceCard`

### 4. `src/pages/Projects.tsx`
- حذف `onArchive` من استدعاء `ProjectCard`
- حذف `"archived"` من labels في `handleStatusChange`
- حذف خيار "مؤرشف" من فلتر الحالة (SelectItem)

### 5. `src/pages/Invoices.tsx`
- حذف دالتي `handleArchive` و `handleUnarchive`
- حذف `Archive`, `RotateCcw` من imports
- حذف زر الأرشفة/إلغاء الأرشفة من جدول الفواتير
- حذف خيار "مؤرشفة" من فلتر الحالة
- حذف `archived` من قاموس التسميات

### 6. `src/pages/admin/AdminFinance.tsx`
- حذف دالة `handleArchiveInvoice`
- حذف `Archive` من imports
- حذف زر الأرشفة من جدول الفواتير
- حذف خيار "مؤرشفة" من فلتر الحالة

### 7. `src/components/admin/ServiceApprovalCard.tsx`
- تعديل شرط إعادة التفعيل ليشمل `suspended` فقط بدلاً من `suspended || archived`

---

## ملاحظة
- سيتم الاحتفاظ بتسميات وألوان حالة "مؤرشف/مؤرشفة" في الجداول الإدارية (AdminProjects, AdminServiceDetail) كعرض فقط، لأن سجلات قديمة قد تحمل هذه الحالة.
- لن يتم تعديل قاعدة البيانات - فقط إزالة الأزرار والدوال من الواجهة.

