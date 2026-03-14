

# إضافة البريد الإلكتروني وحذف السعر بالساعة من صفحة تفاصيل المستخدم

## التغييرات

### 1. إنشاء دالة قاعدة بيانات `get_user_email_admin`
البريد الإلكتروني موجود في `auth.users` وليس في `profiles`، لذا نحتاج دالة `SECURITY DEFINER` تُرجع البريد للأدمن فقط.

```sql
CREATE OR REPLACE FUNCTION public.get_user_email_admin(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT email FROM auth.users WHERE id = p_user_id;
$$;
```

### 2. تحديث `src/hooks/useAdminUserById.ts`
- استدعاء `get_user_email_admin` لجلب البريد وإضافته للبيانات المُرجعة.

### 3. تحديث `src/pages/admin/AdminUserDetail.tsx`
- **حذف** حقل "السعر بالساعة" من قسم "بيانات مقدم الخدمة" (سطر 438-442)
- **إضافة** حقل البريد الإلكتروني في قسم "البيانات الأساسية" بعد الهاتف
- **حذف** `hourly_rate` من `getProfileFieldsForRole` (سطر 104 و 130)

### 4. تحديث قسم مقدم الخدمة
بعد حذف السعر بالساعة، يبقى فقط حقل المهارات. إذا أصبح القسم فارغاً عملياً يمكن دمجه أو إبقاءه بالمهارات فقط.

