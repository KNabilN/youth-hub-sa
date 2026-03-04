

## المشكلة

استعلام `useAllWithdrawals` يفشل بخطأ **400** لأن جدول `withdrawal_requests` لا يحتوي على مفتاح أجنبي (Foreign Key) يربط `provider_id` بجدول `profiles`. عند محاولة PostgREST عمل JOIN تلقائي، لا يجد العلاقة فيرفض الطلب.

الخطأ من الشبكة:
```text
"Could not find a relationship between 'withdrawal_requests' and 'provider_id' in the schema cache"
```

## الحل

### 1. إضافة Foreign Key على مستوى قاعدة البيانات
إنشاء migration لإضافة FK من `withdrawal_requests.provider_id` إلى `profiles.id`:

```sql
ALTER TABLE public.withdrawal_requests
  ADD CONSTRAINT withdrawal_requests_provider_id_fkey
  FOREIGN KEY (provider_id) REFERENCES public.profiles(id);
```

هذا يسمح لـ PostgREST بعمل JOIN تلقائي عبر `.select("*, profiles:provider_id(...)")`.

### 2. لا تغييرات مطلوبة في الكود
الكود الحالي في `useAllWithdrawals` صحيح بالفعل — المشكلة فقط في غياب العلاقة في قاعدة البيانات.

