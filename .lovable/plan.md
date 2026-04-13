

# إضافة قوالب إيميلات الجمعيات الشبابية (youth_association)

## المشكلة
القوالب الحالية مخصصة لمزودي الخدمات فقط. الجمعيات الشبابية تستلم نفس النصوص، رغم أن صياغة الرسائل يجب أن تختلف حسب الدور. كما أن بعض الأنواع المطلوبة للجمعيات غير موجودة أصلاً (مثل `bid_received`, `project_open`, `bank_transfer_*`, `invoice_created`, `deliverable_submitted`, `grant_request_*`, `inquiry_message`).

## التغييرات — ملف واحد

### `supabase/functions/send-notification-email/index.ts`

1. **جلب دور المستخدم**: إضافة استعلام لجدول `user_roles` لمعرفة دور المستلم (`youth_association` أو `service_provider`)

2. **إضافة عناوين مخصصة للأنواع الجديدة** في `CUSTOM_SUBJECTS`:
   - `bid_received` → "وصلكم عرض سعر جديد"
   - `project_open` → "تم فتح المشروع"
   - `bank_transfer_approved` → "تمت الموافقة على التحويل البنكي"
   - `bank_transfer_rejected` → "تعذر اعتماد التحويل البنكي"
   - `invoice_created` → "تم إصدار فاتورة جديدة"
   - `deliverable_submitted` → "تم رفع تسليم جديد على المشروع"
   - `grant_request_approved` → "تمت الموافقة على طلب المنحة"
   - `grant_request_rejected` → "تعذر الموافقة على طلب المنحة"
   - `grant_request_funded` → "تم تمويل طلب المنحة"
   - `inquiry_message` → "إشعار جديد"

3. **تحويل `getCustomBody` إلى دالة تعتمد على الدور**: إنشاء `getCustomBodyForRole(type, role, recipientName, entityName, actionUrl)` تُرجع النصوص المناسبة حسب الدور:
   - إذا كان الدور `youth_association` → استخدام القوالب الجديدة (21 قالب من النص المقدم)
   - إذا كان الدور `service_provider` → استخدام القوالب الحالية (22 قالب)
   - للأنواع المشتركة (مثل `project_completed`, `contract_created`) → نصوص مختلفة حسب الدور
   - إذا لم يُعرف الدور → fallback للقالب العام

4. **بعض العناوين تختلف حسب الدور**:
   - `message_received`: مزود الخدمة = "لديك رسالة جديدة" / جمعية = "لديكم رسالة جديدة"
   - `project_in_progress`: مزود = "بدء العمل على المشروع" / جمعية = "بدأ العمل على المشروع"

5. **نشر الدالة** بعد التحديث

### الأنواع الجديدة (خاصة بالجمعيات فقط)

| النوع | الوصف |
|---|---|
| bid_received | إشعار بوصول عرض سعر جديد |
| project_open | تم فتح المشروع لاستقبال العروض |
| bank_transfer_approved | الموافقة على التحويل البنكي |
| bank_transfer_rejected | رفض التحويل البنكي |
| invoice_created | إصدار فاتورة جديدة |
| deliverable_submitted | رفع تسليم من مزود الخدمة |
| grant_request_approved | الموافقة على طلب منحة |
| grant_request_rejected | رفض طلب منحة |
| grant_request_funded | تمويل طلب منحة |
| inquiry_message | إشعار جديد متعلق بالاستفسارات |

### النتيجة
- كل مستلم يحصل على إيميل بصياغة تناسب دوره
- 21 قالب جديد للجمعيات + 10 أنواع جديدة لم تكن مدعومة
- القالب العام يبقى fallback للأدوار والأنواع غير المغطاة

