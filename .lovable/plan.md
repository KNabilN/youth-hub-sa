

# إصلاح عدم تحديث حالة التوثيق/التعليق تلقائياً في صفحة تفاصيل المستخدم

## المشكلة
عند النقر على "توثيق" أو "تعليق" في صفحة تفاصيل المستخدم (`AdminUserDetail`)، تتم العملية بنجاح لكن الواجهة لا تتحدث تلقائياً — الأزرار والشارات تبقى على حالتها القديمة حتى يتم تحديث الصفحة يدوياً.

## السبب
الـ mutations (`useToggleVerification` و `useToggleSuspension`) تُبطل فقط استعلام `["admin-users"]` (جدول المستخدمين) ولا تُبطل `["admin-user-by-id"]` (صفحة التفاصيل)، ولا `["public-profile"]`.

## الحل
إضافة إبطال لاستعلامات `["admin-user-by-id"]` و `["public-profile"]` في كلا الـ mutations.

## الملف المتأثر
**`src/hooks/useAdminUsers.ts`** — تحديث `onSuccess` في:
1. `useToggleVerification` (سطر 89): إضافة invalidation لـ `["admin-user-by-id"]` و `["public-profile"]`
2. `useToggleSuspension` (سطر 101): نفس الإضافة

```typescript
// useToggleVerification
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["admin-users"] });
  qc.invalidateQueries({ queryKey: ["admin-user-by-id"] });
  qc.invalidateQueries({ queryKey: ["public-profile"] });
},

// useToggleSuspension
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["admin-users"] });
  qc.invalidateQueries({ queryKey: ["admin-user-by-id"] });
  qc.invalidateQueries({ queryKey: ["public-profile"] });
},
```

