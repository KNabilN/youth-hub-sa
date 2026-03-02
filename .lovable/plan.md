
# سلة المحذوفات (Soft Delete + Recycle Bin)

## الفكرة
بدلاً من الحذف النهائي، يتم نقل السجلات إلى "سلة محذوفات" لمدة 30 يوماً مع إمكانية الاسترجاع، ثم تُحذف نهائياً بعد انتهاء المدة.

---

## التغييرات المطلوبة

### 1. تعديل قاعدة البيانات (Migration)

اضافة عمود `deleted_at` للجداول الرئيسية التي يمكن حذفها:
- `micro_services` (الخدمات)
- `projects` (الطلبات)
- `support_tickets` (التذاكر)
- `portfolio_items` (أعمال المعرض)
- `disputes` (الشكاوى)

```text
ALTER TABLE micro_services ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE projects ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE support_tickets ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE portfolio_items ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE disputes ADD COLUMN deleted_at timestamptz DEFAULT NULL;
```

اضافة دالة للحذف النهائي التلقائي بعد 30 يوماً (تُستدعى يدوياً أو عبر cron):

```text
CREATE FUNCTION purge_soft_deleted_records()
  -- يحذف نهائياً السجلات التي مضى عليها 30 يوماً
```

اضافة extension `pg_cron` وجدولة التنظيف التلقائي اليومي.

تحديث سياسات RLS لتصفية السجلات المحذوفة تلقائياً من الاستعلامات العادية + السماح بقراءتها في صفحة سلة المحذوفات.

### 2. إنشاء Hook للمحذوفات (`src/hooks/useTrash.ts`)

- `useTrashItems()` - جلب جميع العناصر المحذوفة للمستخدم الحالي من كل الجداول
- `useRestoreItem()` - استرجاع عنصر (UPDATE deleted_at = NULL)
- `usePermanentDelete()` - حذف نهائي (DELETE فعلي)
- `useSoftDelete()` - حذف ناعم (UPDATE deleted_at = now())

### 3. تعديل hooks الحذف الحالية

تحويل جميع عمليات الحذف من `DELETE` إلى `UPDATE deleted_at = now()`:

- `src/hooks/useMyServices.ts` - `useDeleteService`
- `src/hooks/useAdminServices.ts` - `useAdminDeleteService`
- `src/hooks/usePortfolio.ts` - `useDeletePortfolioItem`

### 4. تعديل hooks الاستعلام

اضافة فلتر `.is("deleted_at", null)` لجميع الاستعلامات:

- `src/hooks/useMyServices.ts` - `useMyServices`
- `src/hooks/useProjects.ts` - `useProjects`, `useProject`
- `src/hooks/useSupportTickets.ts` - `useSupportTickets`
- `src/hooks/usePortfolio.ts` - `usePortfolio`
- `src/hooks/useAdminServices.ts` - `useAdminServices`
- وباقي hooks الاستعلام المرتبطة

### 5. إنشاء صفحة سلة المحذوفات (`src/pages/Trash.tsx`)

صفحة جديدة تعرض:
- تبويبات حسب نوع العنصر (خدمات، طلبات، تذاكر، أعمال)
- لكل عنصر: الاسم، تاريخ الحذف، المدة المتبقية قبل الحذف النهائي
- أزرار: استرجاع / حذف نهائي
- زر "تفريغ سلة المحذوفات" لحذف الكل نهائياً

### 6. تعديل واجهة الحذف

تحديث رسائل التأكيد في جميع dialogs الحذف:
- تغيير "سيتم حذف هذه الخدمة نهائياً" الى "سيتم نقل هذه الخدمة إلى سلة المحذوفات لمدة 30 يوماً"
- الملفات: `src/pages/MyServices.tsx`, `src/components/admin/ServiceApprovalCard.tsx`, `src/components/portfolio/PortfolioManager.tsx`

### 7. إضافة رابط سلة المحذوفات في القائمة الجانبية

تعديل `src/components/AppSidebar.tsx` لإضافة رابط "سلة المحذوفات" مع عداد للعناصر المحذوفة.

### 8. تسجيل Route جديد

تعديل `src/App.tsx` لإضافة `/trash` route محمي.

---

## الملفات المتأثرة

| ملف | نوع التغيير |
|-----|-------------|
| Migration SQL | جديد - اضافة اعمدة + دوال + cron |
| `src/hooks/useTrash.ts` | جديد |
| `src/pages/Trash.tsx` | جديد |
| `src/hooks/useMyServices.ts` | تعديل - soft delete + فلتر |
| `src/hooks/useAdminServices.ts` | تعديل - soft delete + فلتر |
| `src/hooks/useProjects.ts` | تعديل - فلتر |
| `src/hooks/useSupportTickets.ts` | تعديل - فلتر |
| `src/hooks/usePortfolio.ts` | تعديل - soft delete + فلتر |
| `src/pages/MyServices.tsx` | تعديل - رسائل التأكيد |
| `src/components/admin/ServiceApprovalCard.tsx` | تعديل - رسائل التأكيد |
| `src/components/portfolio/PortfolioManager.tsx` | تعديل - رسائل التأكيد |
| `src/components/AppSidebar.tsx` | تعديل - رابط سلة المحذوفات |
| `src/App.tsx` | تعديل - route جديد |
