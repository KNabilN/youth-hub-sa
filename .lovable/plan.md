

# إصلاح خطأ تعديل بيانات المستخدم من لوحة الإدارة

## المشكلة
عند حفظ التعديلات، يُرسل النظام قيم فارغة `""` لحقول `region_id` و `city_id` (من نوع UUID) و `hourly_rate` (من نوع رقمي). قاعدة البيانات ترفض هذه القيم وتعيد خطأ:
```
invalid input syntax for type uuid: ""
```

## الحل
تعديل دالة `handleSubmit` في `AdminDirectEditDialog.tsx` لتحويل القيم الفارغة إلى `null` للحقول التي تتطلب ذلك (UUID، الأرقام).

## التغيير
**ملف: `src/components/admin/AdminDirectEditDialog.tsx`**

في `handleSubmit`، بعد تجميع `updates`، تحويل القيم الفارغة:
- حقول UUID (`region_id`, `city_id`): `""` → `null`
- حقول رقمية (`hourly_rate`): `""` → `null`

```typescript
// Sanitize: convert empty strings to null for UUID/numeric fields
const nullableFields = ["region_id", "city_id", "hourly_rate", "category_id"];
for (const key of nullableFields) {
  if (key in updates && (updates[key] === "" || updates[key] === undefined)) {
    updates[key] = null;
  }
}
// Convert hourly_rate to number if present
if (updates.hourly_rate !== null && updates.hourly_rate !== undefined) {
  updates.hourly_rate = Number(updates.hourly_rate);
}
```

ملف واحد فقط يحتاج تعديل.

