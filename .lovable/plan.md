

## خطة: السماح للجمعية بتعديل الطلب قبل قبول مزود خدمة

### الفكرة
حالياً صفحة `ProjectEdit` تسمح بالتعديل فقط عندما يكون الطلب بحالة `draft`. المطلوب توسيع ذلك ليشمل أي حالة طالما لم يتم تعيين مزود خدمة (`assigned_provider_id = null`)، مع إعادة الطلب لحالة `pending_approval` بعد كل تعديل.

### التعديلات

#### 1. `src/pages/ProjectEdit.tsx`
- تغيير شرط السماح بالتعديل من `status === "draft"` إلى `!project.assigned_provider_id`
- عند الحفظ: إذا كانت الحالة ليست `draft`، يتم تحديث الحالة إلى `pending_approval` تلقائياً مع البيانات المعدّلة
- عرض تنبيه للمستخدم أن التعديل سيعيد الطلب للمراجعة

#### 2. `src/pages/ProjectDetails.tsx`
- إضافة زر "تعديل الطلب" يظهر للجمعية عندما لا يوجد مزود خدمة معيّن (`!project.assigned_provider_id && isAssociation`)
- الزر يوجه لصفحة `/projects/:id/edit`

#### 3. لا حاجة لتعديل قاعدة البيانات
- RLS الحالية تسمح للجمعية بتعديل طلباتها (`Associations manage own projects`)
- التحقق من عدم وجود مزود معيّن يتم في الكود (client + server لأن الجمعية لا تستطيع تغيير `assigned_provider_id` بنفسها)

### الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `src/pages/ProjectEdit.tsx` | توسيع شرط التعديل + إعادة الحالة لـ pending_approval |
| `src/pages/ProjectDetails.tsx` | إضافة زر تعديل |

