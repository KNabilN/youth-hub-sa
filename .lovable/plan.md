
# إصلاح تناقض عدد الخدمات بانتظار الموافقة

## المشكلة
استعلام الإحصائيات في `useAdminStats.ts` يعدّ الخدمات بحالة `pending` بدون استثناء المحذوفة (soft-deleted)، بينما جدول الخدمات يستثنيها. هذا يسبب ظهور "1 خدمة بانتظار الموافقة" في لوحة التحكم لكن عند الدخول للخدمات لا تظهر أي خدمة.

## الحل
إضافة فلتر `.is("deleted_at", null)` لاستعلام `pendingServices` في `useAdminStats.ts`.

## الملف المتأثر
- `src/hooks/useAdminStats.ts` — سطر 35: إضافة `.is("deleted_at", null)` قبل `.eq("approval", "pending")`

## التغيير
```typescript
// قبل
supabase.from("micro_services").select("id", { count: "exact", head: true }).eq("approval", "pending"),

// بعد
supabase.from("micro_services").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("approval", "pending"),
```
