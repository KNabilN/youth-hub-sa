

# إضافة زر "إعادة إرسال إيميل التوثيق" في جدول المستخدمين

## المشكلة
إذا لم يؤكد المستخدم بريده الإلكتروني، لا توجد طريقة للأدمن لإعادة إرسال رسالة التأكيد.

## الحل

### 1. إنشاء Edge Function جديدة: `admin-resend-confirmation`
- تستقبل `user_id` من الأدمن
- تتحقق أن المُستدعي `super_admin`
- تستخدم `adminClient.auth.admin.generateLink({ type: 'signup', email })` لتوليد رابط تأكيد جديد
- أو تستخدم `adminClient.auth.resend({ type: 'signup', email })` لإعادة الإرسال
- ملف: `supabase/functions/admin-resend-confirmation/index.ts`

### 2. تعديل `UserTable.tsx`
- إضافة أيقونة `Mail` من lucide-react
- إضافة state `resendingId` لتتبع المستخدم الجاري إعادة الإرسال له
- إضافة زر `إعادة إرسال` بجانب أزرار الإجراءات الأخرى
- الزر يستدعي Edge Function عبر `supabase.functions.invoke("admin-resend-confirmation", { body: { user_id } })`
- يظهر toast بالنجاح أو الخطأ

### ملفات متأثرة

| الملف | العملية |
|-------|---------|
| `supabase/functions/admin-resend-confirmation/index.ts` | إنشاء — Edge Function جديدة |
| `src/components/admin/UserTable.tsx` | تعديل — إضافة زر إعادة الإرسال |

