

# إضافة خيار الرفض مع السبب للطلبات والخدمات في لوحة الأدمن

## المشكلة
- **الطلبات (Projects)**: الأدمن يقدر يوافق (pending_approval → open) أو يلغي، لكن مفيش خيار "رفض" يرجع الطلب للجمعية مع سبب عشان تعدّل وتعيد التقديم
- **الخدمات (Services)**: زر الرفض موجود لكن بدون ديالوج لكتابة سبب الرفض — بيترفض مباشرة بدون توضيح

## الحل

### 1. Migration — إضافة حقل `rejection_reason` + حالة `rejected` للمشاريع
- إضافة عمود `rejection_reason text` لجدولي `projects` و `micro_services`
- إضافة قيمة `rejected` لـ enum `project_status`
- تحديث trigger الإشعارات ليرسل سبب الرفض مع الإشعار

### 2. تعديل `AdminProjectDetail.tsx` — إضافة خيار الرفض
- تحديث `getAdminAllowedStatuses`: عند `pending_approval` يعرض `["open", "rejected"]`
- استبدال Select العادي بأزرار واضحة (موافقة / رفض) عند حالة `pending_approval`
- عند الضغط على "رفض" يظهر ديالوج لكتابة سبب الرفض (إجباري)
- عند التأكيد: يتم تحديث الحالة + حفظ `rejection_reason`

### 3. تعديل `ServiceApprovalCard.tsx` — ديالوج سبب الرفض
- استبدال `handleApproval("rejected")` المباشر بديالوج يطلب سبب الرفض
- حفظ السبب في عمود `rejection_reason` الجديد

### 4. عرض سبب الرفض للجمعية/مزود الخدمة
- في صفحة `Projects.tsx` (طلبات الجمعية): عرض بانر تنبيه بسبب الرفض مع إمكانية التعديل وإعادة التقديم
- في صفحة `MyServices.tsx`: عرض سبب الرفض على الخدمات المرفوضة
- تحديث `ProjectStatusBadge` ليشمل حالة `rejected`

### 5. إعادة التقديم بعد الرفض
- عند حالة `rejected`: يظهر زر "تعديل وإعادة التقديم" للجمعية
- عند الحفظ يتحول الطلب تلقائياً لـ `pending_approval` (نفس المنطق الحالي للتعديل)

### الملفات المتأثرة:
- **Migration**: إضافة `rejection_reason` + حالة `rejected` + تحديث triggers
- `src/pages/admin/AdminProjectDetail.tsx` — أزرار موافقة/رفض + ديالوج
- `src/components/admin/ServiceApprovalCard.tsx` — ديالوج سبب رفض الخدمة
- `src/hooks/useAdminProjects.ts` — mutation تدعم `rejection_reason`
- `src/hooks/useAdminServices.ts` — mutation تدعم `rejection_reason`
- `src/components/projects/ProjectStatusBadge.tsx` — حالة rejected
- `src/pages/Projects.tsx` — عرض سبب الرفض + زر إعادة التقديم
- `src/pages/MyServices.tsx` — عرض سبب الرفض

