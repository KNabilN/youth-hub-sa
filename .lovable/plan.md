

# خطة: حذف ناعم (Soft Delete) شامل من لوحة الأدمن

## الوضع الحالي
- الـ Trash يدعم 5 جداول فقط: `micro_services`, `projects`, `support_tickets`, `portfolio_items`, `disputes`
- الـ `useTrashItems` يفلتر بـ `ownerCol` حسب المستخدم الحالي — لكن الأدمن يحتاج يشوف **كل** المحذوفات
- الجداول التالية **لا تحتوي** على `deleted_at`: `profiles`, `invoices`, `contracts`, `bids`, `escrow_transactions`, `ratings`
- دالة `purge_soft_deleted_records` موجودة لكنها تغطي الـ 5 جداول الحالية فقط

## التغييرات المطلوبة

### 1. Database Migration
إضافة `deleted_at` للجداول الناقصة:
```sql
ALTER TABLE profiles ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE contracts ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE bids ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE ratings ADD COLUMN deleted_at timestamptz DEFAULT NULL;
```
تحديث دالة `purge_soft_deleted_records` لتشمل الجداول الجديدة.

### 2. تحديث `useTrash.ts`
- توسيع `TrashTableName` ليشمل: `profiles`, `invoices`, `contracts`, `bids`, `ratings`
- إضافة `tableConfig` لكل جدول جديد مع `ownerCol` و `titleCol`
- **عند كون المستخدم admin**: لا يفلتر بـ `ownerCol` بل يجلب **جميع** العناصر المحذوفة من كل الجداول
- تحديث `useEmptyTrash` لنفس المنطق

### 3. تحديث `Trash.tsx`
- إضافة تبويبات جديدة للجداول المضافة (مستخدمين، فواتير، عقود، عروض أسعار، تقييمات)
- إضافة أيقونات مناسبة لكل تبويب

### 4. إضافة زر "حذف" في صفحات الأدمن
إضافة زر soft-delete في كل صفحة إدارة:
- **AdminUsers** (`UserTable.tsx`): زر حذف لكل مستخدم
- **AdminServices** (`AdminServices.tsx`): زر حذف لكل خدمة (إن لم يكن موجود)
- **AdminProjects** (`AdminProjects.tsx`): زر حذف لكل طلب
- **AdminDisputes** (via `useAdminDisputes`): زر حذف
- **AdminTickets**: زر حذف
- **AdminFinance**: زر حذف للفواتير

كل زر يستدعي `useSoftDelete` مع confirmation dialog.

### 5. تحديث الاستعلامات الإدارية
إضافة `.is("deleted_at", null)` للاستعلامات التي لا تفلترها حالياً:
- `useAdminUsers` — فلترة profiles المحذوفة
- `useInvoices` — فلترة الفواتير المحذوفة
- أي hook آخر يعرض بيانات الجداول الجديدة

### 6. تحديث `purge_soft_deleted_records`
توسيع الدالة لتشمل الجداول الجديدة.

## ملخص الملفات

| الملف | التغيير |
|---|---|
| Migration SQL | إضافة `deleted_at` + تحديث purge function |
| `src/hooks/useTrash.ts` | توسيع الجداول + منطق admin يجلب الكل |
| `src/pages/Trash.tsx` | تبويبات جديدة |
| `src/components/admin/UserTable.tsx` | زر حذف مستخدم |
| `src/pages/admin/AdminServices.tsx` | زر حذف خدمة |
| `src/pages/admin/AdminProjects.tsx` | زر حذف طلب |
| `src/pages/admin/AdminFinance.tsx` | زر حذف فاتورة |
| `src/hooks/useAdminUsers.ts` | فلترة deleted_at |
| `src/hooks/useAdminFinance.ts` | فلترة deleted_at |
| `src/hooks/useAdminTickets.ts` | (موجود بالفعل) |

