

# تحديث قوالب إيميلات مزودي الخدمات

## ما سيتم تنفيذه

تحديث ملف `supabase/functions/send-notification-email/index.ts` لاستبدال القالب العام الحالي بقوالب مخصصة لكل نوع إشعار حسب المحتوى المقدم.

## التغييرات

### ملف واحد: `supabase/functions/send-notification-email/index.ts`

1. **إضافة جلب اسم المشروع/الخدمة**: عند وجود `entity_id` و `entity_type` في الإشعار، يتم جلب اسم الكيان من جدول `projects` أو `micro_services` لاستخدامه في القالب

2. **إضافة map للعناوين المخصصة (subjects)** لكل نوع إشعار:
   - `bid_accepted` → "تم قبول عرضك - منصة الخدمات المشتركة للجمعيات الشبابية"
   - `bid_rejected` → "تعذر قبول عرضك - ..."
   - `project_in_progress` → "بدء العمل على المشروع - ..."
   - وهكذا لجميع الأنواع الـ 21 المذكورة

3. **إضافة map لنصوص البريد المخصصة** لكل نوع، مع استبدال:
   - `[اسم المستلم]` ← اسم المستخدم من `profiles.full_name`
   - `[اسم المشروع/الخدمة]` ← اسم الكيان المجلوب من DB
   - `[رابط الصفحة / رابط الإجراء]` ← رابط مبني من `entity_type` + `entity_id`

4. **تحديث `buildEmailHTML`** ليستقبل النص الكامل المخصص بدلاً من الرسالة العامة، مع الحفاظ على نفس التصميم البصري (الألوان، الشعار، التنسيق)

5. **نشر الدالة** بعد التحديث

### الأنواع المشمولة (21 قالب)

| النوع | العنوان |
|---|---|
| bid_accepted | تم قبول عرضك |
| bid_rejected | تعذر قبول عرضك |
| project_in_progress | بدء العمل على المشروع |
| project_completed | تم إكمال المشروع |
| project_cancelled | تم إلغاء المشروع |
| project_disputed | تم تسجيل شكوى على المشروع |
| contract_created | تم إنشاء عقد جديد |
| contract_signed | تم توقيع العقد |
| escrow_created | تم إنشاء الضمان المالي |
| escrow_released | تم تحرير الضمان المالي |
| escrow_refunded | تم استرداد الضمان المالي |
| withdrawal_approved | تمت الموافقة على طلب السحب |
| withdrawal_rejected | تعذر الموافقة على طلب السحب |
| withdrawal_processed | تم تحويل مبلغ السحب |
| service_approved | تمت الموافقة على الخدمة |
| service_rejected | تعذر اعتماد الخدمة |
| service_purchased | تم شراء خدمتك |
| timelog_approved | تمت الموافقة على الساعات المسجلة |
| timelog_rejected | تعذر اعتماد الساعات المسجلة |
| deliverable_accepted | تم قبول التسليمات |
| deliverable_revision | مطلوب إجراء تعديلات على التسليمات |
| message_received | لديك رسالة جديدة |

### الأنواع غير المشمولة في هذه الدفعة
الأنواع الأخرى (مثل `dispute_opened`, `grant_request_*`, `bank_transfer_*`, إلخ) ستستمر باستخدام القالب العام الحالي حتى توفير قوالبها.

