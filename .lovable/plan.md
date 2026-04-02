

# إصلاح فشل رفع صورة الخدمة من حساب الأدمن

## المشكلة
سياسة RLS على bucket `service-images` تسمح فقط للمستخدم برفع ملفات في مجلد يحمل اسم الـ `user_id` الخاص به:
```sql
bucket_id = 'service-images' AND (storage.foldername(name))[1] = auth.uid()::text
```

لكن كود الأدمن يرفع الصورة في مجلد `admin/`:
```ts
const path = `admin/${Date.now()}_${Math.random()...}.${ext}`;
```

هذا يعني أن الأدمن لا يملك صلاحية الرفع لأن المجلد لا يطابق الـ `uid` الخاص به.

## الحل
إضافة سياسة RLS جديدة تسمح للأدمن (super_admin) برفع الصور في أي مجلد داخل bucket `service-images`.

### 1) إضافة migration لسياسة RLS جديدة
```sql
CREATE POLICY "Admins upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images'
  AND public.has_role(auth.uid(), 'super_admin')
);
```

وأيضاً سياسة للتحديث (upsert يحتاج UPDATE):
```sql
CREATE POLICY "Admins update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images'
  AND public.has_role(auth.uid(), 'super_admin')
);
```

### الملفات المتأثرة
| الملف | التغيير |
|-------|---------|
| Migration جديد | إضافة سياستي RLS للأدمن على `service-images` |

لا حاجة لتعديل أي كود في الواجهة أو الـ Edge Functions — المشكلة بالكامل في صلاحيات التخزين.

