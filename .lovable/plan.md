

# التحقق من وجود البريد الإلكتروني قبل إرسال رابط الاستعادة

## المشكلة
عند إدخال بريد إلكتروني غير مسجل في صفحة "نسيت كلمة المرور"، يقوم النظام بعرض رسالة نجاح وكأن الرابط أُرسل، لأن Supabase لا يُرجع خطأ في هذه الحالة (لأسباب أمنية).

## الحل
إنشاء دالة قاعدة بيانات (RPC) تتحقق من وجود البريد في جدول `auth.users` بصلاحيات `SECURITY DEFINER`، واستدعاؤها قبل إرسال رابط الاستعادة.

## التغييرات

### 1. إنشاء دالة قاعدة بيانات `check_email_exists`
- دالة `SECURITY DEFINER` تبحث في `auth.users` عن البريد المُدخل
- تُرجع `true` إن وُجد، `false` إن لم يوجد

```sql
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(p_email)
  );
$$;
```

### 2. تحديث `src/pages/ForgotPassword.tsx`
- قبل استدعاء `resetPasswordForEmail`، استدعاء `supabase.rpc('check_email_exists', { p_email: email })`
- إذا أرجعت `false`، عرض رسالة خطأ: "البريد الإلكتروني غير مسجل في المنصة"
- إذا أرجعت `true`، متابعة إرسال رابط الاستعادة

