

# خطة تنفيذ الفجوات المتبقية (~10%)

---

## المرحلة أ: سجل النشاط لكل كيان + التراجع عن الإجراءات (أولوية عالية)

### 1. مكون EntityActivityLog
- إنشاء `src/components/admin/EntityActivityLog.tsx` - مكون قابل لإعادة الاستخدام يعرض سجلات `audit_log` مفلترة حسب `table_name` و `record_id`
- إنشاء hook `src/hooks/useEntityAuditLog.ts` يستعلم عن audit_log بفلتر الجدول والمعرف
- يعرض: الإجراء، التاريخ/الوقت، القيم القديمة والجديدة في شكل مبسط

### 2. تضمين سجل النشاط في الصفحات
- **UserDetailSheet**: إضافة تبويب "سجل النشاط" يعرض `EntityActivityLog` بفلتر `table_name=profiles` و `record_id=userId`
- **ProjectDetails**: إضافة تبويب "سجل النشاط" ضمن Tabs الموجودة
- **ServiceApprovalCard**: إضافة زر يفتح Dialog يعرض سجل النشاط للخدمة

### 3. التراجع عن الإجراءات الإدارية (Undo)
- في `UserTable.tsx`: عند إلغاء تعليق المستخدم، إلزام إدخال "سبب إلغاء التعليق" وتسجيله في audit_log عبر `logAudit()`
- في `ServiceApprovalCard.tsx`: عند تعليق/إعادة تفعيل خدمة، إلزام إدخال السبب عبر Dialog وتسجيله في audit_log

---

## المرحلة ب: نموذج التواصل + سبب إلزامي للإجراءات (أولوية متوسطة)

### 4. نموذج "تواصل معنا" في الصفحة الرئيسية
- إنشاء `src/components/landing/ContactForm.tsx` - نموذج بسيط (الاسم، البريد، الرسالة) مع validation عبر zod
- إنشاء Edge Function `supabase/functions/contact-form/index.ts` لاستقبال الرسالة وتخزينها في جدول جديد `contact_messages`
- إنشاء migration لجدول `contact_messages` (id, name, email, message, created_at, status) مع RLS
- تضمين النموذج في `Index.tsx` قبل قسم CTA

### 5. سبب إلزامي عند تعليق/إعادة تفعيل الخدمات
- تعديل `ServiceApprovalCard.tsx`: إضافة Dialog يطلب السبب عند الضغط على "تعليق" أو "إعادة تفعيل"
- تسجيل السبب في audit_log عبر `logAudit()`

---

## المرحلة ج: لوحة الرحلات + تحسينات (أولوية منخفضة)

### 6. لوحة رحلة المستخدم (Journey Board)
- إنشاء `src/components/dashboard/JourneyBoard.tsx` - يعرض ملخص العمليات الأخيرة لكل دور:
  - الجمعية: مشاريع مقدمة -> عروض مستلمة -> عقود -> تنفيذ -> إتمام
  - المزود: عروض مقدمة -> عقود -> ساعات -> أرباح
  - المانح: تبرعات -> تخصيصات -> أثر
- تضمينه في `Dashboard.tsx` تحت الإحصائيات

### 7. زر طباعة مباشرة للتقارير
- إضافة زر `window.print()` في `AdminReports.tsx`

### 8. إخفاء هوية المشتري في الخدمات المصغرة
- لا يحتاج تغيير في الـ schema (يمكن استخدام `is_private` من المشروع المرتبط)
- عند عرض مشتريات الخدمة للمزود، إخفاء اسم الجمعية إذا كان المشروع `is_private=true`

---

## ملخص الملفات

```text
ملفات جديدة:
- src/components/admin/EntityActivityLog.tsx
- src/hooks/useEntityAuditLog.ts
- src/components/landing/ContactForm.tsx
- supabase/functions/contact-form/index.ts
- src/components/dashboard/JourneyBoard.tsx

ملفات معدلة:
- src/components/admin/UserDetailSheet.tsx (تبويب سجل النشاط)
- src/pages/ProjectDetails.tsx (تبويب سجل النشاط)
- src/components/admin/ServiceApprovalCard.tsx (سبب إلزامي + سجل نشاط)
- src/components/admin/UserTable.tsx (سبب إلزامي لإلغاء التعليق)
- src/pages/Index.tsx (نموذج التواصل)
- src/pages/Dashboard.tsx (لوحة الرحلات)
- src/pages/admin/AdminReports.tsx (زر طباعة)
- .lovable/plan.md (تحديث)

Migration جديد:
- جدول contact_messages مع RLS
```
