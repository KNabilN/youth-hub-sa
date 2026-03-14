

# عرض اسم المنظمة بدلاً من اسم ضابط الاتصال في جدول المستخدمين

## المشكلة
عمود "الاسم" في جدول إدارة المستخدمين يعرض `full_name` (اسم ضابط الاتصال) بدلاً من `organization_name` (اسم المنظمة).

## الحل
استخدام دالة `getDisplayName` الموجودة مسبقاً في `src/lib/utils.ts` التي تعطي الأولوية لـ `organization_name` ثم `full_name`.

## التغييرات في `src/components/admin/UserTable.tsx`

1. **استيراد** `getDisplayName` من `@/lib/utils`
2. **سطر 272**: تغيير `{u.full_name || "—"}` إلى `{getDisplayName(u)}`
3. **سطر 106**: تحديث البحث ليشمل `organization_name` أيضاً
4. **سطر 373، 427**: تحديث رسائل التأكيد (تعليق/حذف) لاستخدام `getDisplayName`

ملف واحد فقط يتأثر.

