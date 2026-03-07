
# خطة: إرسال إيميلات الإشعارات عبر PHP Relay

## الحالة: ✅ تم التنفيذ

### ما تم تنفيذه

1. **Edge Function `send-notification-email`** — تستخدم `fetch()` لإرسال البريد عبر PHP Relay على `api.sharedservices.solutions`
2. **DB Trigger `trg_send_notification_email`** — يستدعي Edge Function عبر `pg_net` عند كل إشعار جديد
3. **تصنيف الإشعارات** — إضافة `defaultEnabled` لكل نوع:
   - مفعّل افتراضياً: الإشعارات المهمة (قبول/رفض عروض، عقود، مالية، نزاعات)
   - معطّل افتراضياً: الإشعارات المتكررة (رسائل، عروض واردة، ضمان جديد)
4. **حذف Edge Functions القديمة** — `send-email` و `notify-deliverable`
5. **تحديث `notification-preferences.ts`** — دعم `defaultEnabled` + حذف `isNotificationEnabled` (dead code)
6. **تحديث `NotificationPreferences.tsx`** — عرض القيم الافتراضية الصحيحة
7. **Error Handling** — عند فشل الإرسال يتم تحديث `delivery_status` إلى `failed` في قاعدة البيانات
8. **Secret `RELAY_API_KEY`** — مفتاح المصادقة مع PHP Relay
