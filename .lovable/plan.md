
# إصلاح إرسال إشعارات البريد الإلكتروني + تفعيل الكل افتراضياً

## الحالة: ✅ تم التنفيذ

### ما تم تنفيذه

1. **إصلاح trigger function** — استبدال `extensions.http_post()` بـ `net.http_post()` (إضافة pg_net المثبتة فعلاً)
2. **تفعيل جميع الإشعارات افتراضياً** — تغيير كل `defaultEnabled: false` و `DEFAULT_ENABLED: false` إلى `true` في:
   - `supabase/functions/send-notification-email/index.ts` (Edge Function)
   - `src/lib/notification-preferences.ts` (الواجهة)
3. **نشر Edge Function** — تم نشر `send-notification-email` بالتحديثات الجديدة
4. **معالجة الإشعارات العالقة** — تم تحديث ~80 إشعار عالق بحالة `pending` إلى `skipped_legacy` لأنها قديمة
