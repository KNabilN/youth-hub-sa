

## المشكلة

### 1. الإشعارات مكررة مرتين
السبب واضح: يوجد **تريغرين** لكل جدول بنفس الوظيفة لكن بأسماء مختلفة. مثلاً على جدول `bids`:
- `trg_notify_bid_change` (من الهجرة الأصلية)
- `trg_notify_on_bid_change` (من هجرة التنظيف)

هجرة التنظيف حذفت فقط النسخ بصيغة `trg_notify_on_*` ثم أعادت إنشاءها، لكن لم تحذف النسخ الأصلية بصيغة `trg_notify_*` (بدون `_on_`). النتيجة: كل حدث يطلق تريغرين = إشعارين.

الجداول المتأثرة (13 تريغر مكرر):
- `bids`, `contracts`, `escrow_transactions`, `bank_transfers`, `projects`, `disputes`, `time_logs`, `withdrawal_requests`, `messages`, `project_deliverables`, `micro_services`, `grant_requests` + `escrow_transactions` (service_purchase)

### 2. الإشعارات غير قابلة للنقر
حالياً `NotificationItem` يعرض النص فقط بدون أي رابط للانتقال للكيان المعني.

---

## الحل

### 1. هجرة SQL لحذف التريغرات المكررة
حذف جميع التريغرات بصيغة الاسم القديم (بدون `_on_`):
```sql
DROP TRIGGER IF EXISTS trg_notify_bid_change ON public.bids;
DROP TRIGGER IF EXISTS trg_notify_contract_change ON public.contracts;
DROP TRIGGER IF EXISTS trg_notify_escrow_change ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_notify_bank_transfer_change ON public.bank_transfers;
DROP TRIGGER IF EXISTS trg_notify_project_status ON public.projects;
DROP TRIGGER IF EXISTS trg_notify_dispute_change ON public.disputes;
DROP TRIGGER IF EXISTS trg_notify_timelog_approval ON public.time_logs;
DROP TRIGGER IF EXISTS trg_notify_withdrawal_change ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
DROP TRIGGER IF EXISTS trg_notify_deliverable_change ON public.project_deliverables;
DROP TRIGGER IF EXISTS trg_notify_service_approval ON public.micro_services;
DROP TRIGGER IF EXISTS trg_notify_service_purchase ON public.escrow_transactions;
DROP TRIGGER IF EXISTS trg_notify_grant_request ON public.grant_requests;
DROP TRIGGER IF EXISTS trg_notify_grant_request_change ON public.grant_requests;
```

### 2. تعديل `NotificationItem.tsx` — إضافة التنقل عند الضغط
إضافة mapping من نوع الإشعار إلى رابط التنقل. يتم استخراج الكيان المعني من نص الإشعار أو إضافة حقل `entity_id` و `entity_type` للإشعارات (الخيار الأفضل).

**لكن** بما أن الجدول الحالي لا يحتوي على `entity_id`/`entity_type`، سنضيف هذين العمودين:

**هجرة SQL:**
```sql
ALTER TABLE notifications ADD COLUMN entity_id uuid;
ALTER TABLE notifications ADD COLUMN entity_type text;
```

**تحديث دوال التريغرات** لتمرير `entity_id` و `entity_type` مع كل إشعار.

**تحديث `NotificationItem`** لاستخدام `entity_id` + `entity_type` لبناء رابط التنقل:
- `project` → `/projects/{id}`
- `contract` → `/contracts`
- `service` → `/services/{id}`
- `dispute` → `/disputes/{id}`
- `bid` → `/projects/{id}`
- `escrow` → `/admin/finance` (للأدمن) أو `/earnings` (للمزود)
- `withdrawal` → `/earnings`
- `message` → `/messages`
- `ticket` → `/tickets/{id}`

### الملفات المتأثرة
- **SQL Migration**: حذف التريغرات المكررة + إضافة أعمدة `entity_id`/`entity_type` + تحديث دوال التريغرات
- `src/components/notifications/NotificationItem.tsx` — جعل الإشعار قابلاً للنقر باستخدام `Link`
- `src/pages/Notifications.tsx` — تمرير الخصائص الجديدة
- `supabase/functions/moyasar-verify-payment/index.ts` — إضافة `entity_id`/`entity_type` للإشعارات المُنشأة من الـ Edge Function

