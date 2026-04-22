

## إصلاح فشل إرسال رسائل الإدارة

### السبب الجذري
Trigger `notify_admin_direct_message` يستدعي الدالة `send_notification_secure` بترتيب **معاملات خاطئ**:

```
الدالة تتوقع:  (_recipient_id, _message, _type, _entity_id, _entity_type)
الـ Trigger يمرر: (user_id, 'admin_message', 'لديك رسالة...', 'admin_message', NEW.id)
                                ↑ message      ↑ type            ↑ entity_id (نص!)  ↑ entity_type (uuid!)
```

النتيجة:
- `_entity_id` يستقبل نص `'admin_message'` بدل UUID → فشل التحويل لنوع `uuid`
- يفشل INSERT بأكمله → ظهور "فشل إرسال الرسالة"

### الحل
Migration واحدة تعيد تعريف الدالة `notify_admin_direct_message` بالترتيب الصحيح:

```sql
PERFORM send_notification_secure(
  _recipient_id := NEW.user_id,           -- (للأدمن→مستخدم) أو admin_id (للعكس)
  _message      := 'لديك رسالة جديدة من الإدارة',
  _type         := 'admin_message',        -- أو 'admin_message_reply'
  _entity_id    := NEW.id,                 -- معرّف الرسالة (uuid)
  _entity_type  := 'admin_message'
);
```

سأستخدم **named parameters** (`:=`) لتفادي تكرار الخطأ مستقبلاً.

### الملفات
- migration جديدة فقط: تعيد تعريف `public.notify_admin_direct_message()` (لا تغيير على الـ trigger ولا الجدول ولا RLS).

### بدون تأثير
- لا تغيير على البيانات الموجودة، الواجهة، أو أي وظيفة أخرى.

