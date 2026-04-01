

# إصلاح إعادة إرسال إيميل التوثيق

## المشكلة
الزر يعمل ويعيد `success: true` لكن الإيميل لا يصل فعلياً. السبب المحتمل:
1. استدعاء `auth.resend` بدون `emailRedirectTo` قد يمنع إرسال الرسالة
2. استخدام `getClaims` غير متوفر في بعض إصدارات supabase-js — يجب استبداله بـ `getUser`

## الحل — تعديل `supabase/functions/admin-resend-confirmation/index.ts`

### 1. استبدال `getClaims` بـ `getUser` للتحقق من هوية المستدعي
```typescript
const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
if (callerError || !callerUser) { return 401; }
const callerId = callerUser.id;
```

### 2. إضافة `emailRedirectTo` لـ `auth.resend`
```typescript
const { error: resendError } = await adminClient.auth.resend({
  type: "signup",
  email,
  options: {
    emailRedirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.supabase.co')}/auth/v1/callback`
  }
});
```

### 3. إضافة logging لتسهيل التتبع
إضافة `console.log` قبل وبعد الاستدعاء لرؤية النتيجة في السجلات.

### ملف متأثر واحد

| الملف | التغيير |
|-------|---------|
| `supabase/functions/admin-resend-confirmation/index.ts` | إصلاح التحقق + إضافة emailRedirectTo + logging |

