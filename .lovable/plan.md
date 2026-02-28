

## تحويل صفحة إدارة الخدمات إلى عرض جدول مثل طلبات الجمعيات

### الملخص
تحويل صفحة `AdminServices` من عرض البطاقات (Cards) إلى عرض جدول (Table) مطابق لتصميم صفحة `AdminProjects`.

### التغييرات

**تعديل `src/pages/admin/AdminServices.tsx`**
- استبدال عرض البطاقات (`ServiceApprovalCard` grid) بجدول مطابق لـ `AdminProjects`
- أعمدة الجدول: العنوان، مقدم الخدمة، التصنيف، الحالة، السعر، تغيير الحالة، إجراءات
- إضافة dropdown لتغيير حالة الموافقة مباشرة من الجدول (مثل تغيير حالة المشروع)
- إضافة زر "تعديل" يفتح `AdminDirectEditDialog`
- إضافة pagination باستخدام `usePagination` و `PaginationControls`
- نقل منطق الموافقة/الرفض/التعليق من `ServiceApprovalCard` إلى الصفحة مباشرة

### تفاصيل تقنية

**هيكل الجدول:**

```text
العنوان | مقدم الخدمة | التصنيف | الحالة (Badge) | السعر | تغيير الحالة (Select) | إجراءات (تعديل)
```

**الملفات المتأثرة:**
- `src/pages/admin/AdminServices.tsx` -- إعادة كتابة بالكامل ليطابق نمط `AdminProjects`

**ملاحظة:** `ServiceApprovalCard` سيبقى موجوداً لكن لن يُستخدم في هذه الصفحة بعد التعديل.

