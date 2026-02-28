

## تعديل بيانات المستخدمين مباشرة بدون طلب تعديل

### الملخص
استبدال `EditRequestDialog` في جدول المستخدمين بـ `AdminDirectEditDialog` ليتمكن الأدمن من تعديل بيانات أي مستخدم فوراً بدون إرسال طلب.

### التغييرات

**1. تعديل `src/components/admin/UserTable.tsx`**
- استبدال `EditRequestDialog` بـ `AdminDirectEditDialog`
- إزالة import الـ `EditRequestDialog`
- توسيع قائمة الحقول القابلة للتعديل لتشمل جميع حقول الملف الشخصي:
  - الاسم (full_name)
  - الهاتف (phone)
  - اسم المنظمة (organization_name)
  - رقم الترخيص (license_number)
  - اسم ضابط الاتصال (contact_officer_name)
  - رقم ضابط الاتصال (contact_officer_phone)
  - بريد ضابط الاتصال (contact_officer_email)
  - صفة ضابط الاتصال (contact_officer_title)
  - نبذة (bio) - textarea
  - السعر بالساعة (hourly_rate) - number
- ربط `onSave` بـ `useAdminUpdateProfile` mutation الموجود بالفعل
- تغيير عنوان الحوار من "طلب تعديل الملف الشخصي" إلى "تعديل الملف الشخصي"

### تفاصيل تقنية

- الـ mutation `useAdminUpdateProfile` موجود بالفعل في `useAdminUsers.ts` ويدعم تحديث أي حقل في جدول `profiles`
- RLS policy "Admins can update all profiles" تسمح لـ super_admin بالتعديل
- لا حاجة لتغييرات في قاعدة البيانات أو hooks جديدة

**الملفات المتأثرة:**
- `src/components/admin/UserTable.tsx` -- تعديل فقط

