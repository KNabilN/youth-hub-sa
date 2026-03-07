
# خطة: إرسال إيميلات الإشعارات عبر SMTP من cPanel

## الحالة: ✅ تم التنفيذ

### ما تم تنفيذه

1. **Edge Function `send-notification-email`** — تستخدم `denomailer` لإرسال البريد عبر SMTP من cPanel
2. **DB Trigger `trg_send_notification_email`** — يستدعي Edge Function عبر `pg_net` عند كل إشعار جديد
3. **تصنيف الإشعارات** — إضافة `defaultEnabled` لكل نوع:
   - مفعّل افتراضياً: الإشعارات المهمة (قبول/رفض عروض، عقود، مالية، نزاعات)
   - معطّل افتراضياً: الإشعارات المتكررة (رسائل، عروض واردة، ضمان جديد)
4. **حذف Edge Functions القديمة** — `send-email` و `notify-deliverable`
5. **تحديث `notification-preferences.ts`** — دعم `defaultEnabled` في كل نوع
6. **تحديث `NotificationPreferences.tsx`** — عرض القيم الافتراضية الصحيحة
