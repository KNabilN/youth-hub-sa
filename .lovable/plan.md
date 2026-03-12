

# حذف حقل "السعر بالساعة" من نموذج تسجيل مستخدم جديد

## التغيير
إزالة حقل `hourlyRate` بالكامل من `AdminCreateUserDialog.tsx`:
- حذف state: `const [hourlyRate, setHourlyRate]`
- حذف من `resetForm()`
- حذف `hourly_rate` من body المرسل للـ edge function
- حذف عنصر الإدخال من الواجهة

## الملف المتأثر
- `src/components/admin/AdminCreateUserDialog.tsx`

