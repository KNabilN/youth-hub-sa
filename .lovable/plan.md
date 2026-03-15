

# إصلاح زر "حفظ كمسودة" في تعديل الطلبات + خطأ التصنيف

## المشاكل المكتشفة

1. **صفحة `ProjectEdit.tsx` لا تمرر `onSaveDraft`** إلى `ProjectForm`، لذلك زر "حفظ كمسودة" لا يظهر أبداً عند التعديل.

2. **في `ProjectForm.tsx` سطر 360**: الزر يظهر فقط في الخطوات 0 و1 (`step < 2`)، بينما يجب أن يظهر في كل الخطوات ما عدا الأخيرة (أو حتى فيها).

3. **خطأ "Expected string, received null" على التصنيف** (ظاهر في الصورة): عند تعديل طلب، `category_id` قد يكون `null` لكن الـ schema يطلب `.min(1)`. يجب التأكد من تمرير `""` بدل `null` كقيمة افتراضية.

## التغييرات

### 1. `src/pages/ProjectEdit.tsx`
- إضافة `handleSaveDraft` يحفظ التعديلات مع الإبقاء على `status: "draft"`.
- تمرير `onSaveDraft` و `onCreateDraft` (لخطوة المرفقات) إلى `ProjectForm`.
- إظهار زر حفظ المسودة فقط إذا كان الطلب بحالة `draft`.

### 2. `src/components/projects/ProjectForm.tsx`
- تغيير شرط إظهار زر "حفظ كمسودة" من `step < 2` إلى `step < 3` ليظهر في كل الخطوات عدا المراجعة النهائية (حيث يوجد زر الإرسال).
- ضمان أن `category_id` الافتراضية تكون `""` وليس `null` لمنع خطأ zod.

### 3. `src/pages/ProjectEdit.tsx` — defaultValues
- تحويل `category_id: project.category_id` إلى `category_id: project.category_id ?? ""` لمنع تمرير `null`.

