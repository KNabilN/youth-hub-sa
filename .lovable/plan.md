

# إصلاح إرسال إشعارات البريد الإلكتروني + تفعيل الكل افتراضياً

## المشكلة الجذرية

**الإشعارات لا تُرسل أبداً عبر البريد** — 83 إشعار عالقة بحالة `pending` وواحد فقط `delivered`.

**السبب**: الدالة `send_notification_email_trigger` تستدعي `extensions.http_post()` (من إضافة `http`)، لكن هذه الإضافة **غير مثبتة**. الإضافة المثبتة هي `pg_net` والدالة الصحيحة هي `net.http_post()`. بلوك `EXCEPTION WHEN OTHERS` يبتلع الخطأ بصمت، فلا يظهر أي خطأ لكن البريد لا يُرسل.

## التغييرات المطلوبة

### 1. هجرة قاعدة بيانات — إصلاح الـ trigger function
- استبدال `extensions.http_post(...)` بـ `net.http_post(...)` بالتوقيع الصحيح
- `net.http_post` تعمل بشكل غير متزامن (async) وهو المطلوب

### 2. تفعيل جميع الإشعارات افتراضياً
**في Edge Function** (`send-notification-email/index.ts`):
- تغيير كل `false` في `DEFAULT_ENABLED` إلى `true`

**في الواجهة** (`notification-preferences.ts`):
- تغيير كل `defaultEnabled: false` إلى `true` لجميع الأنواع في كل الأدوار

### 3. إعادة إرسال الإشعارات العالقة
- تحديث الإشعارات العالقة بـ `pending` لإعادة محاولة إرسالها (عبر edge function مباشرة أو إعادة إدراجها)

### 4. إعادة نشر الـ Edge Function
- نشر `send-notification-email` بعد تحديث الافتراضيات

## الملفات المتأثرة
- `supabase/functions/send-notification-email/index.ts` — تغيير الافتراضيات
- `src/lib/notification-preferences.ts` — تغيير الافتراضيات في الواجهة
- هجرة SQL — إصلاح `send_notification_email_trigger`

