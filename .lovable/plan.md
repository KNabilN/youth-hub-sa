
# إضافة أرقام فريدة للخدمات والشكاوى

## الوضع الحالي
- **طلبات الجمعيات (Projects)**: لديها رقم فريد `request_number` بتنسيق `RQ-YYYYMMDD-NNNN`
- **تذاكر الدعم (Support Tickets)**: لديها رقم فريد `ticket_number` بتنسيق `TK-YYYYMMDD-NNNN`
- **الفواتير (Invoices)**: لديها `invoice_number`
- **الخدمات (Services)**: لا يوجد رقم فريد
- **الشكاوى (Disputes)**: لا يوجد رقم فريد

## التغييرات المطلوبة

### 1. قاعدة البيانات (Migration)

اضافة عمودين جديدين مع مشغلات تلقائية:

| الجدول | العمود | التنسيق | مثال |
|--------|--------|---------|------|
| `micro_services` | `service_number` | `SV-YYYYMMDD-NNNN` | SV-20260302-0001 |
| `disputes` | `dispute_number` | `DS-YYYYMMDD-NNNN` | DS-20260302-0001 |

- اضافة عمود `service_number` (text, NOT NULL, default '') لجدول `micro_services`
- اضافة عمود `dispute_number` (text, NOT NULL, default '') لجدول `disputes`
- انشاء trigger function `generate_service_number()` بنفس نمط `generate_ticket_number()`
- انشاء trigger function `generate_dispute_number()` بنفس النمط
- ربط المشغلات بالجداول (BEFORE INSERT)
- تعبئة الأرقام للسجلات الموجودة مسبقا

### 2. عرض الأرقام في الواجهة

#### الخدمات:
- **`MyServiceCard.tsx`**: عرض `service_number` أسفل عنوان الخدمة
- **`ServiceDetail.tsx`**: عرض الرقم في تفاصيل الخدمة
- **صفحة ادارة الخدمات (`AdminServices.tsx`)**: اضافة عمود رقم الخدمة في الجدول
- **`ServiceCard.tsx` (السوق)**: عرض الرقم

#### الشكاوى:
- **`MyDisputes.tsx`**: عرض `dispute_number` في بطاقة الشكوى
- **`AdminDisputes.tsx`**: اضافة عمود رقم الشكوى في الجدول + البحث بالرقم
- **`AdminDisputeDetail.tsx`**: عرض الرقم في صفحة التفاصيل

### الملفات المتأثرة
- **Migration**: جدول `micro_services` و `disputes` (اعمدة + triggers)
- **تعديل**: `src/components/services/MyServiceCard.tsx` - عرض الرقم
- **تعديل**: `src/pages/ServiceDetail.tsx` - عرض الرقم
- **تعديل**: `src/pages/admin/AdminServices.tsx` - عمود الرقم
- **تعديل**: `src/components/marketplace/ServiceCard.tsx` - عرض الرقم
- **تعديل**: `src/pages/MyDisputes.tsx` - عرض الرقم
- **تعديل**: `src/pages/admin/AdminDisputes.tsx` - عمود الرقم + بحث
- **تعديل**: `src/pages/admin/AdminDisputeDetail.tsx` - عرض الرقم
