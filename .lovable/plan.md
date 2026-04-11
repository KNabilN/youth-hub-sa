

# إصلاح تصدير الخدمات — يشمل خدمات محذوفة/غير منشورة

## المشكلة
استعلام التصدير في صفحة إدارة الخدمات (`AdminServices.tsx`) وصفحة التقارير (`AdminReports.tsx`) لا يُفلتر بـ `deleted_at IS NULL`. هذا يعني أن الخدمات المحذوفة (soft-deleted) والقديمة تظهر في ملف Excel رغم أنها غير موجودة في المنصة.

مثال: خدمة "محسن نور" تظهر كـ "مقبول" في Excel لكنها غير مقبولة فعلياً في المنصة.

## الحل

| الملف | التغيير |
|---|---|
| `src/pages/admin/AdminServices.tsx` (سطر 327) | إضافة `.is("deleted_at", null)` للاستعلام في دالة `onExport` |
| `src/pages/admin/AdminReports.tsx` (سطر 335) | إضافة `.is("deleted_at", null)` للاستعلام في دالة `exportServices` |

### التغيير الدقيق

**AdminServices.tsx** — سطر 327:
```typescript
// قبل
const { data } = await supabase.from("micro_services").select("*, categories(name), regions(name), cities(name), profiles!micro_services_provider_id_fkey(full_name)");

// بعد
const { data } = await supabase.from("micro_services").select("*, categories(name), regions(name), cities(name), profiles!micro_services_provider_id_fkey(full_name)").is("deleted_at", null);
```

**AdminReports.tsx** — سطر 335:
```typescript
// إضافة .is("deleted_at", null) بعد .lte("created_at", dateTo)
```

تغيير بسيط في سطرين فقط يحل المشكلة بالكامل.

