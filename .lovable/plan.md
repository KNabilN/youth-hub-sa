

# إضافة شارة إشعارات على تبويب الفواتير في الصفحة المالية

## الفكرة
إضافة شارة حمراء على تبويب "الفواتير" تعرض عدد الفواتير الجديدة (التي لم يطلع عليها الأدمن)، وتختفي تلقائياً عند فتح التبويب.

## الآلية
- استخدام `localStorage` لتخزين تاريخ آخر مرة فتح فيها الأدمن تبويب الفواتير (`admin_invoices_last_seen`)
- عد الفواتير التي تم إنشاؤها بعد هذا التاريخ
- عند فتح تبويب الفواتير، تحديث التاريخ وإعادة حساب العدد

## التغييرات

### 1. `src/hooks/useAdminFinancePending.ts`
- إضافة استعلام لعد الفواتير الجديدة بعد `admin_invoices_last_seen` من localStorage
- إرجاع `invoices` ضمن النتيجة

### 2. `src/pages/admin/AdminFinance.tsx`
- تحويل `Tabs` من `defaultValue` إلى `value` + `onValueChange` (controlled)
- عند اختيار تبويب "invoices": تحديث localStorage بالتاريخ الحالي + إعادة تحميل العدد
- إضافة Badge على TabsTrigger الخاص بالفواتير مثل باقي التبويبات

### الملفات المتأثرة:
- `src/hooks/useAdminFinancePending.ts`
- `src/pages/admin/AdminFinance.tsx`

