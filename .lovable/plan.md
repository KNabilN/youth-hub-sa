

# المشكلة: صفحة الجمعيات فارغة

## السبب الجذري

سياسات أمان جدول `user_roles` تسمح فقط للمستخدم بقراءة دوره الخاص:

```sql
USING (user_id = auth.uid())
```

عندما يفتح المانح صفحة الجمعيات، الاستعلام يحاول قراءة أدوار المستخدمين الآخرين (`youth_association`) فيحصل على نتيجة فارغة.

## الحل

إنشاء دالة `security definer` في قاعدة البيانات تُرجع معرفات الجمعيات الموثقة مباشرة، متجاوزة RLS:

```sql
CREATE FUNCTION public.get_verified_association_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id FROM user_roles ur
  JOIN profiles p ON p.id = ur.user_id
  WHERE ur.role = 'youth_association' AND p.is_verified = true;
$$;
```

ثم تعديل الاستعلام في `Associations.tsx` و `useVerifiedAssociations.ts` لاستخدام `supabase.rpc('get_verified_association_ids')` بدلاً من الاستعلام المباشر على `user_roles`.

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| Migration جديد | إنشاء دالة `get_verified_association_ids` |
| `src/pages/Associations.tsx` | استبدال استعلام `user_roles` بـ `rpc` |
| `src/hooks/useVerifiedAssociations.ts` | نفس التعديل |

