

# إصلاح إرسال إيميل التوثيق — استخدام PHP Relay بدلاً من auth.resend

## تحليل المشكلة

### السبب الجذري
1. **`auth.resend({ type: "signup" })` لا يُرسل الإيميل فعلياً** عند استدعائه من service_role في Edge Function — يعيد نجاح لكن بدون تسليم فعلي
2. **`auth.admin.generateLink({ type: "signup" })`** يفشل بخطأ "email_exists" لأن المستخدم مسجل مسبقاً
3. المستخدمون الذين أنشأهم الأدمن يملكون `email_confirmed_at` مسبقاً (لأن `admin-create-user` يستخدم `email_confirm: true`)

### الحل
استخدام `generateLink({ type: "magiclink" })` لتوليد رابط تسجيل دخول، ثم إرساله عبر **PHP Relay** الموجود (`api.sharedservices.solutions/send-email.php`) — نفس البنية التحتية المستخدمة في إشعارات النظام.

## التغييرات في `supabase/functions/admin-resend-confirmation/index.ts`

### 1. استبدال `auth.resend` بـ `generateLink` + إرسال عبر Relay
```typescript
// بدلاً من auth.resend:
const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
  type: "magiclink",
  email,
});

if (linkError) throw linkError;

const actionLink = linkData.properties.action_link;

// إرسال عبر PHP Relay (نفس طريقة send-notification-email)
const relayApiKey = Deno.env.get("RELAY_API_KEY");
await fetch("https://api.sharedservices.solutions/send-email.php", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-API-Key": relayApiKey },
  body: JSON.stringify({
    to: email,
    subject: "تأكيد حسابك — منصة الشباب",
    body: buildConfirmationHTML(actionLink),
  }),
});
```

### 2. إزالة فحص `email_confirmed_at`
الإيميل يُرسل دائماً بغض النظر عن حالة التأكيد — الأدمن يقرر متى يريد إعادة الإرسال.

### 3. إضافة قالب HTML للإيميل
قالب بنفس تصميم إيميلات النظام (منصة الشباب) مع زر "تأكيد الحساب" يحتوي على رابط `action_link`.

## التغييرات في `src/components/admin/UserTable.tsx`

### إخفاء زر إعادة الإرسال للمستخدمين المؤكدين بالفعل
لا تغيير — الزر يبقى متاحاً لكل المستخدمين والأدمن يقرر متى يستخدمه.

### ملفات متأثرة

| الملف | التغيير |
|-------|---------|
| `supabase/functions/admin-resend-confirmation/index.ts` | استبدال auth.resend بـ generateLink + PHP Relay |

