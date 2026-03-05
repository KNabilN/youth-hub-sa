

# خطة: تحكم الأدمن في الخدمات والطلبات المعروضة بالصفحة الرئيسية

## الفكرة
إضافة عمود `is_featured` لجدولي `micro_services` و `projects` يتحكم فيه الأدمن لتحديد أي خدمات وطلبات تظهر بالصفحة الرئيسية.

## التغييرات

### 1. Database Migration
```sql
ALTER TABLE micro_services ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
```

### 2. تحديث `useLandingStats.ts`
- الخدمات: فلترة بـ `is_featured = true` أولاً، وإذا لم يوجد featured يعرض حسب `display_order` كالحالي (fallback)
- الطلبات: نفس المنطق — `is_featured = true` أولاً ثم fallback للأحدث

### 3. تحديث `AdminServices.tsx`
- إضافة عمود "مميز" في الجدول مع Toggle/Switch لكل خدمة يتحكم بـ `is_featured`

### 4. تحديث `AdminProjects.tsx` (أو إنشاء صفحة مشابهة)
- إضافة عمود "مميز" مع Toggle لكل طلب

### 5. تحديث hooks الأدمن
- `useAdminServices` و `useAdminProjects` يجلبون `is_featured` تلقائياً (موجود بالفعل مع `select("*")`)

## ملخص الملفات

| الملف | التغيير |
|---|---|
| Migration | إضافة `is_featured` لجدولين |
| `src/hooks/useLandingStats.ts` | فلترة بـ `is_featured` |
| `src/pages/admin/AdminServices.tsx` | Toggle للتمييز |
| `src/pages/admin/AdminProjects.tsx` | Toggle للتمييز |

