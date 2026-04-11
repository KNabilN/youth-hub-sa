

# منع استخدام كود الخصم أكثر من مرة لنفس المستخدم

## المشكلة
نفس الجمعية استخدمت كود `XY300` مرتين في عمليتين مختلفتين (18:13 و 18:27). لا يوجد قيد في قاعدة البيانات أو تحقق في الكود يمنع إعادة استخدام نفس الكود من نفس المستخدم.

## الحل

### 1. Migration — إضافة قيد فريد على قاعدة البيانات
```sql
ALTER TABLE discount_code_usages ADD CONSTRAINT unique_code_per_user UNIQUE (code_id, user_id);
```
هذا يمنع على مستوى قاعدة البيانات تسجيل نفس الكود لنفس المستخدم أكثر من مرة.

### 2. `src/hooks/useDiscountCode.ts` — التحقق قبل التطبيق
في دالة `validateCode`، بعد التحقق من صلاحية الكود وقبل إرجاع النتيجة، نتحقق هل المستخدم الحالي استخدم هذا الكود سابقاً:

```typescript
// Check if current user already used this code
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { count } = await supabase
    .from("discount_code_usages")
    .select("id", { count: "exact", head: true })
    .eq("code_id", data.id)
    .eq("user_id", user.id);
  if (count && count > 0) {
    toast.error("لقد استخدمت هذا الكود من قبل");
    return null;
  }
}
```

### 3. `src/pages/PaymentCallback.tsx` — حماية إضافية
إضافة `ON CONFLICT DO NOTHING` أو التحقق قبل الإدراج لمنع الخطأ في حال محاولة التسجيل المكرر.

| الملف | التغيير |
|---|---|
| Migration جديد | إضافة `UNIQUE (code_id, user_id)` على `discount_code_usages` |
| `src/hooks/useDiscountCode.ts` | التحقق من عدم استخدام الكود سابقاً عند التطبيق |
| `src/pages/PaymentCallback.tsx` | حماية ضد التكرار عند تسجيل الاستخدام |

