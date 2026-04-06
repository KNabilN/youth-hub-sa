

# مراجعة وإصلاح نظام أكواد الخصم — 5 أخطاء

## الأخطاء المكتشفة

### 1. مبلغ Moyasar يتجاهل الخصم
**السطر 625**: `amount={useGrantBalance ? remainingAfterGrant : pricing.total}`
يجب أن يكون `totalAfterDiscount` وليس `pricing.total` عند عدم استخدام المنح.

### 2. لا يتم تسجيل استخدام كود الخصم في مسار الدفع الإلكتروني/البنكي
`recordUsage` يُستدعى فقط في مسار "المنح تغطي الكل" (سطر 192). في مسار التحويل البنكي والدفع الإلكتروني لا يتم تسجيل الاستخدام أبداً.

### 3. مبالغ حوار التأكيد لا تعكس الخصم
السطور 774-779 تستخدم `pricing.total` بدلاً من `totalAfterDiscount` في نصوص التأكيد.

### 4. مبلغ التحويل البنكي في navigate لا يعكس الخصم
السطر 269: `total: pricing.total` بدلاً من `totalAfterDiscount`.

### 5. استعلام تفاصيل الاستخدام في صفحة الأدمن لن يعمل
`useDiscountCodeUsages` يحاول JOIN مع `profiles:user_id(...)` لكن لا يوجد FK من `discount_code_usages.user_id` إلى `profiles.id`. نحتاج إضافة FK أو تغيير طريقة الاستعلام.

## الإصلاحات

### `src/pages/Checkout.tsx`
1. سطر 625: تغيير `pricing.total` إلى `totalAfterDiscount`
2. إضافة `recordUsage` بعد نجاح التحويل البنكي (قبل `clearCart` في سطر 266) وفي مسار الدفع الإلكتروني (تخزين بيانات الخصم في `paymentContext`)
3. تحديث نصوص حوار التأكيد لتعكس `totalAfterDiscount` بدلاً من `pricing.total`
4. سطر 269: تغيير `total: pricing.total` إلى `total: totalAfterDiscount`

### Migration جديد
إضافة FK من `discount_code_usages.user_id` إلى `profiles.id`:
```sql
ALTER TABLE discount_code_usages 
ADD CONSTRAINT discount_code_usages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id);
```

### ملفات متأثرة

| الملف | التغيير |
|-------|---------|
| `src/pages/Checkout.tsx` | إصلاح 4 أخطاء في المبالغ وتسجيل الاستخدام |
| Migration جديد | إضافة FK لـ user_id → profiles |

