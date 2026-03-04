

# مراجعة شاملة للمنصة: UI/UX، قواعد البيانات، والتدفقات الوظيفية

## ملخص الوضع الحالي

المنصة متطورة وتحتوي على +40 صفحة مع 4 أدوار مختلفة. بعد المراجعة الشاملة، وجدت المشاكل التالية:

---

## 1. مشاكل UI/UX والاتساق

### أ. صفحة 404 بالإنجليزية
- `NotFound.tsx` يعرض "Oops! Page not found" و "Return to Home" — يجب ترجمتها للعربية لتتوافق مع بقية المنصة

### ب. صفحة Auth فارغة الخلفية
- `Auth.tsx` يعرض فقط `div` فارغ مع المودال — عند إغلاق المودال يظهر صفحة بيضاء فارغة بدون هيدر أو فوتر

### ج. عدم اتساق في عرض الحالات الفارغة
- صفحة `Projects.tsx` تستخدم `<div className="text-center">` بسيط للحالة الفارغة بينما بقية الصفحات تستخدم مكون `<EmptyState />` الموحد

### د. غياب gradient divider في بعض الصفحات
- صفحة `ProjectDetails.tsx` لا تحتوي على الـ gradient divider الموحد (`h-1 rounded-full bg-gradient-to-l`)

---

## 2. مشاكل قواعد البيانات والربط

### أ. Foreign keys مفقودة في `bank_transfers`
- تم إضافة FK لـ `user_id → profiles` مؤخراً، لكن `escrow_id → escrow_transactions` موجود فقط كـ constraint بدون FK رسمي على مستوى types — يجب التحقق

### ب. `bank_transfers` — `reviewed_by` بدون FK
- عمود `reviewed_by` لا يرتبط بـ `profiles`، مما يعني عدم إمكانية عرض اسم المراجع

### ج. Trigger الـ `bank_transfer` غير مرتبط
- قسم `<db-triggers>` يظهر "There are no triggers" — رغم وجود functions مثل `notify_on_bank_transfer_change()` — يبدو أن الـ triggers لم تُنشأ فعلياً أو أُزيلت

---

## 3. مشاكل في التدفقات الوظيفية

### أ. Triggers غير مفعّلة
المشكلة الأكبر: جميع trigger functions موجودة لكن **لا يوجد أي trigger مرتبط بها** حسب `<db-triggers>`. هذا يعني:
- لا إشعارات تلقائية عند تغيير حالة المشروع
- لا إشعارات عند تحويل بنكي جديد
- لا إشعارات عند عرض سعر جديد
- لا إشعارات عند رسالة جديدة
- لا تحديث تلقائي لأرقام التذاكر/الطلبات/الخدمات
- لا تدقيق (audit log) تلقائي
- لا إنشاء تذكرة تلقائية من نموذج التواصل

هذا يؤثر على **كل تدفق في النظام**.

### ب. Donations — project path يستخدم `user.id` كـ `payee_id`
- في `Donations.tsx` سطر 90: `const associationId = formData.association_id || user.id` — إذا لم تُحدد جمعية، المانح يدفع لنفسه

### ج. عدم وجود تحقق من الدور في بعض الصفحات
- صفحة `Donations` و `DonorPurchases` متاحة لجميع المستخدمين المسجلين عبر `/donations` و `/donor-purchases` بدون تحقق من أن المستخدم فعلاً مانح

---

## 4. الخطة المقترحة للإصلاح

### المرحلة 1: إصلاح الـ Triggers (الأكثر أهمية)
إنشاء migration واحد يربط كل الـ trigger functions بجداولها:
- `notify_on_bid_change` → `bids` (INSERT, UPDATE)
- `notify_on_contract_change` → `contracts` (INSERT, UPDATE)
- `notify_on_escrow_change` → `escrow_transactions` (INSERT, UPDATE)
- `notify_on_bank_transfer_change` → `bank_transfers` (INSERT, UPDATE)
- `notify_on_project_status_change` → `projects` (UPDATE)
- `notify_on_dispute_change` → `disputes` (INSERT, UPDATE)
- `notify_on_timelog_approval` → `time_logs` (UPDATE)
- `notify_on_withdrawal_change` → `withdrawal_requests` (UPDATE)
- `notify_on_new_message` → `messages` (INSERT)
- `notify_on_deliverable_change` → `project_deliverables` (INSERT, UPDATE)
- `notify_on_service_approval` → `micro_services` (UPDATE)
- `notify_on_service_purchase` → `escrow_transactions` (INSERT)
- `increment_service_sales` → `escrow_transactions` (INSERT)
- `generate_ticket_number` → `support_tickets` (INSERT)
- `generate_request_number` → `projects` (INSERT)
- `generate_service_number` → `micro_services` (INSERT)
- `generate_dispute_number` → `disputes` (INSERT)
- `log_dispute_status_change` → `disputes` (UPDATE)
- `create_ticket_from_contact` → `contact_messages` (INSERT)
- `update_support_ticket_updated_at` → `support_tickets` (UPDATE)
- `audit_trigger_func` → `projects`, `escrow_transactions`, `contracts` (INSERT, UPDATE, DELETE)

### المرحلة 2: إصلاح UI/UX
1. ترجمة صفحة 404 للعربية
2. توحيد EmptyState في صفحة Projects
3. إضافة gradient divider في ProjectDetails
4. إصلاح صفحة Auth لتعرض الخلفية بشكل صحيح

### المرحلة 3: إصلاح التدفقات
1. إصلاح `payee_id` في مسار التبرع للمشاريع
2. إضافة `reviewed_by` FK في `bank_transfers`

---

## الملفات المتأثرة

| ملف | التغيير |
|-----|---------|
| Migration SQL جديد | إنشاء جميع الـ triggers المفقودة |
| `src/pages/NotFound.tsx` | ترجمة للعربية |
| `src/pages/Projects.tsx` | استخدام EmptyState |
| `src/pages/ProjectDetails.tsx` | إضافة gradient divider |
| `src/pages/Donations.tsx` | إصلاح payee_id fallback |

