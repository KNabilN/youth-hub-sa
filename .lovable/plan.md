

# إصلاح عدم تحديث البيانات بعد حفظ التعديلات

## المشكلة
التعديلات تُحفظ بنجاح في قاعدة البيانات (الطلب يرجع 204)، لكن الصفحة لا تُحدّث البيانات المعروضة لأن cache الاستعلام الخاص بتفاصيل المستخدم لا يتم إبطاله بعد الحفظ.

## السبب التقني
في `src/hooks/useAdminUsers.ts`، دالة `useAdminUpdateProfile` تُبطل فقط `["admin-users"]` (قائمة المستخدمين) ولا تُبطل `["admin-user-by-id"]` (تفاصيل المستخدم المحدد). لذلك صفحة التفاصيل تظل تعرض البيانات القديمة من الـ cache.

## الحل
تحديث `onSuccess` في `useAdminUpdateProfile` لإبطال كلا الاستعلامين:

### الملف: `src/hooks/useAdminUsers.ts`
- إضافة `invalidateQueries` لـ `["admin-user-by-id"]` و `["public-profile"]` في callback الـ `onSuccess`

هذا تغيير بسيط من سطر واحد إلى 3 أسطر في دالة `onSuccess`.
