

# مراجعة شاملة لنظام تذاكر الدعم والاشتراكات

## الوضع الحالي

### ما يعمل بشكل صحيح
- **Realtime على `support_tickets`**: مفعّل ✓ (للأدمن وللمستخدم)
- **Realtime على `ticket_replies`**: مفعّل ✓ (تم تفعيله مؤخراً)
- **RLS على `ticket_replies`**: الأدمن يقرأ/يكتب الكل، صاحب التذكرة يقرأ/يكتب على تذاكره ✓
- **RLS على `support_tickets`**: الأدمن يدير الكل، المستخدم يدير تذاكره ✓
- **Realtime في `useTicketReplies`**: اشتراك مع فلتر `ticket_id` ✓
- **Realtime في `useSupportTickets`**: اشتراك مع فلتر `user_id` ✓
- **Realtime في `useAdminTickets`**: اشتراك بدون فلتر (يشوف كل التذاكر) ✓

## المشاكل المكتشفة

### 1. لا يوجد إشعار عند الرد على تذكرة (مشكلة حرجة)
لا يوجد trigger على جدول `ticket_replies` لإنشاء إشعار. عندما يرد الأدمن، الجمعية لا تحصل على إشعار في جرس الإشعارات ولا بريد إلكتروني. والعكس صحيح — عندما ترد الجمعية، الأدمن لا يحصل على إشعار.

**الحل**: إنشاء trigger `notify_on_ticket_reply()` على `ticket_replies` يرسل إشعار للطرف الآخر.

### 2. صفحة تفاصيل التذكرة (المستخدم) بدون Realtime للحالة
`TicketDetail.tsx` يستخدم query عادي بمفتاح `["ticket-detail", id]` بدون اشتراك Realtime. إذا غيّر الأدمن حالة التذكرة، المستخدم لن يرى التغيير إلا بعد تحديث الصفحة.

**الحل**: إضافة اشتراك Realtime على `support_tickets` مفلتر بـ `id` في `TicketDetail.tsx`.

### 3. تكرار trigger على `support_tickets`
يوجد 3 triggers متكررة تنفذ نفس الوظيفة `update_support_ticket_updated_at`:
- `trg_support_tickets_updated_at`
- `trg_update_support_ticket_updated_at`  
- `trg_update_ticket_updated_at`

**الحل**: حذف الاثنين الزائدين والإبقاء على واحد.

### 4. `useAdminTicketById` بدون Realtime
صفحة تفاصيل التذكرة عند الأدمن لا تتحدث تلقائياً عند تغيير الحالة من مكان آخر.

**الحل**: إضافة اشتراك Realtime في `useAdminTicketById`.

## التغييرات المطلوبة

| الملف/المكان | التغيير |
|---|---|
| **Migration جديد** | إنشاء function `notify_on_ticket_reply()` + trigger على `ticket_replies` |
| **Migration جديد** | حذف triggers المكررة على `support_tickets` |
| **`src/pages/TicketDetail.tsx`** | إضافة اشتراك Realtime لتحديث حالة التذكرة فورياً |
| **`src/hooks/useAdminTicketById.ts`** | إضافة اشتراك Realtime لتحديث بيانات التذكرة فورياً |

### تفاصيل trigger الإشعار
```sql
-- عند إضافة رد جديد:
-- إذا كان الكاتب هو صاحب التذكرة → إشعار لكل الأدمن
-- إذا كان الكاتب أدمن → إشعار لصاحب التذكرة
```

