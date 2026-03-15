

# حذف حقل "سعر الساعة" من كافة أنحاء النظام

## الملخص
حقل `hourly_rate` / "سعر الساعة" غير مستخدم فعلياً في النظام. سيتم حذفه من جميع الواجهات والمنطق البرمجي.

## التغييرات

### 1. `src/pages/Profile.tsx`
- حذف `hourly_rate` من قائمة `requiredFields.service_provider`
- حذف state `hourlyRate` و `setHourlyRate`
- حذف تعيين القيمة من `useEffect`
- حذف `hourly_rate` من كائن التحديث في `handleSave`
- حذف عنصر الإدخال (Label + Input) الخاص بسعر الساعة (السطور 406-413)
- حذف استيراد `DollarSign` إذا لم يُستخدم في مكان آخر

### 2. `src/components/admin/UserDetailSheet.tsx`
- حذف سطر InfoRow الخاص بـ "السعر بالساعة" (السطور 155-157)

### 3. `src/components/admin/UserTable.tsx`
- حذف `{ key: "hourly_rate", label: "السعر بالساعة", type: "number" }` من مصفوفة `editableFields`

### 4. `src/components/admin/AdminDirectEditDialog.tsx`
- حذف `hourly_rate` من `nullableFields`
- حذف تحويل `hourly_rate` إلى رقم

### 5. `src/components/admin/EntityActivityLog.tsx`
- حذف `hourly_rate: "سعر الساعة"` من labels

### 6. `src/hooks/useProfile.ts`
- حذف `hourly_rate` من `ESSENTIAL_FIELDS`

### 7. `src/hooks/useProfileCompleteness.ts`
- حذف `{ key: "hourly_rate", label: "سعر الساعة" }` من حقول `service_provider`

### 8. `src/hooks/usePublicProfile.ts`
- حذف `hourly_rate` من type definition

### 9. `src/pages/admin/AdminReports.tsx`
- حذف استعلام `hourlyRateData` بالكامل (السطور 229-243)
- حذف بطاقة رسم "توزيع أسعار الساعة" (السطور 658-687)

### 10. `supabase/functions/admin-create-user/index.ts`
- حذف `hourly_rate` من body destructuring ومن كائن التحديث

### ملاحظة
- لن يتم حذف العمود من قاعدة البيانات لتجنب أي مشاكل — سيبقى موجوداً لكن غير مستخدم
- ملف `types.ts` لا يُعدّل يدوياً (يُولّد تلقائياً)

