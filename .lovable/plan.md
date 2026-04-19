
## الطلب
عند تسجيل جمعية شبابية جديدة:
1. جعل **رقم الترخيص** حقلاً إلزامياً
2. جعله **فريداً** (Unique) — لا يُسمح بتكرار رقم ترخيص مسجَّل مسبقاً

## التحقيق السريع
- حقل `license_number` موجود في جدول `profiles` (نوع text، nullable، بدون قيد unique)
- يظهر حقل الترخيص حالياً في `AuthModal` ضمن خطوة استكمال بيانات الجمعية، لكنه ليس إلزامياً ولا يوجد فحص تكرار
- يوجد ضابط (trigger) `handle_new_user` ينشئ صف `profiles` تلقائياً عند التسجيل

## التغييرات

### 1. قاعدة البيانات (Migration)
- إضافة **Unique Partial Index** على `profiles.license_number`:
  ```sql
  CREATE UNIQUE INDEX profiles_license_number_unique
  ON public.profiles (license_number)
  WHERE license_number IS NOT NULL AND btrim(license_number) <> '';
  ```
  (يستخدم Partial Index ليتجاهل القيم الفارغة لأن المانحين ومزودي الخدمة لا يملكون رقم ترخيص)

- إضافة دالة فحص متاحة للجمهور (لتجنب السباق race condition قبل الإرسال):
  ```sql
  CREATE FUNCTION public.check_license_number_exists(p_license text)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER ...
  ```

### 2. واجهة التسجيل — `src/components/AuthModal.tsx`
- جعل حقل **رقم الترخيص** إلزامياً عند اختيار دور `youth_association`
- إضافة فحص فوري (on blur) باستخدام `check_license_number_exists` لإظهار رسالة "رقم الترخيص مسجَّل مسبقاً"
- منع المتابعة إذا كان الحقل فارغاً أو مكرراً
- ترجمة خطأ Postgres `23505` (unique violation) إلى رسالة عربية واضحة عند الإرسال النهائي

### 3. صفحة الملف الشخصي — `src/pages/Profile.tsx`
- إضافة نفس فحص التكرار عند تحديث رقم الترخيص (يستثني المستخدم نفسه)
- ترجمة خطأ unique violation إلى عربية

### 4. أداة الإدارة — `src/components/admin/AdminCreateUserDialog.tsx`
- إذا كان الدور `youth_association`: جعل رقم الترخيص إلزامياً + معالجة خطأ unique violation
