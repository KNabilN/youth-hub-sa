

## تحويل إدارة الطلبات والخدمات إلى تعديل مباشر من الأدمن

### الملخص
حالياً، الأدمن يستخدم نظام "طلب تعديل" (Edit Request) الذي يرسل طلباً للمستخدم لقبوله. سيتم تغيير هذا إلى تعديل مباشر فوري بدون الحاجة لموافقة أي طرف.

### التغييرات

**1. إضافة mutation للتعديل المباشر في `useAdminProjects.ts`**
- إضافة `useAdminUpdateProject` mutation يحدّث أي حقل في جدول `projects` مباشرة (title, description, budget, category_id, region_id, etc.)

**2. إضافة mutation للتعديل المباشر في `useAdminServices.ts`**
- إضافة `useAdminUpdateService` mutation يحدّث أي حقل في جدول `micro_services` مباشرة (title, description, price, category_id, region_id, etc.)

**3. إنشاء مكون `AdminDirectEditDialog` جديد**
- ملف: `src/components/admin/AdminDirectEditDialog.tsx`
- يشبه `EditRequestDialog` في الشكل لكنه يحفظ التغييرات مباشرة في قاعدة البيانات
- يدعم حقول النص والأرقام والقوائم المنسدلة (التصنيف، المنطقة)
- لا يوجد حقل "رسالة للمستخدم" -- التعديل فوري
- يعرض toast عند النجاح

**4. تحديث `AdminProjects.tsx`**
- استبدال `EditRequestDialog` بـ `AdminDirectEditDialog`
- تغيير نص الزر من "طلب تعديل" إلى "تعديل"
- إضافة حقول أكثر للتعديل (العنوان، الوصف، الميزانية، التصنيف، المنطقة)

**5. تحديث `ServiceApprovalCard.tsx`**
- استبدال `EditRequestDialog` بـ `AdminDirectEditDialog`
- تغيير نص الزر من "طلب تعديل" إلى "تعديل"
- إضافة حقول أكثر للتعديل (العنوان، الوصف، السعر، التصنيف، المنطقة)

### تفاصيل تقنية

**AdminDirectEditDialog props:**

```text
- open / onOpenChange
- tableName: "projects" | "micro_services"
- recordId: string
- currentValues: Record<string, any>
- fields: FieldConfig[] (extended with "select" type for category/region)
- onSuccess: callback
- title: string
```

**الحقول القابلة للتعديل:**

للطلبات (Projects):
- العنوان (title) - نص
- الوصف (description) - textarea
- الميزانية (budget) - رقم
- التصنيف (category_id) - select
- المنطقة (region_id) - select

للخدمات (Services):
- العنوان (title) - نص
- الوصف (description) - textarea
- السعر (price) - رقم
- التصنيف (category_id) - select
- المنطقة (region_id) - select

**الأمان:**
- RLS policies الحالية تسمح بالفعل لـ super_admin بالتعديل على كلا الجدولين (policy "Admin manage all projects" و "Admin manage all services")
- لا حاجة لتغييرات في قاعدة البيانات

**الملفات المتأثرة:**
- `src/components/admin/AdminDirectEditDialog.tsx` -- جديد
- `src/hooks/useAdminProjects.ts` -- إضافة mutation
- `src/hooks/useAdminServices.ts` -- إضافة mutation
- `src/pages/admin/AdminProjects.tsx` -- استبدال EditRequestDialog
- `src/components/admin/ServiceApprovalCard.tsx` -- استبدال EditRequestDialog

