

# إثراء طلبات المنح بتفاصيل أكتر + رابط بروفايل الجمعية

## المشكلة
نموذج إنشاء طلب المنحة حالياً يحتوي فقط على: مبلغ + وصف نصي واحد. المانح لا يملك معلومات كافية لتقييم الطلب (الهدف، الفئة المستهدفة، عدد المستفيدين، إلخ)، ولا يوجد رابط لزيارة بروفايل الجمعية.

## الحل

### 1. إضافة حقول جديدة لجدول `grant_requests` (Migration)
| الحقل | النوع | الوصف |
|---|---|---|
| `purpose` | text | الهدف من المنحة |
| `target_group` | text | الفئة المستهدفة |
| `beneficiaries_count` | integer | عدد المستفيدين المتوقع |
| `urgency` | text | درجة الاستعجال (عادي، متوسط، عاجل) |

جميعها nullable مع defaults فارغة للتوافق مع البيانات الحالية.

### 2. تحديث نموذج الإنشاء — `src/pages/MyGrants.tsx`
- إضافة الحقول الجديدة في الـ Dialog بشكل منظم
- حقل "الهدف من المنحة" (textarea)
- حقل "الفئة المستهدفة" (input)
- حقل "عدد المستفيدين المتوقع" (number input)
- حقل "درجة الاستعجال" (select: عادي/متوسط/عاجل)

### 3. تحديث `useCreateGrantRequest` — `src/hooks/useGrantRequests.ts`
- إضافة الحقول الجديدة في mutation

### 4. تحديث عرض الطلب للمانح — `src/pages/GrantRequests.tsx` + `src/pages/MyGrantRequests.tsx`
- عرض التفاصيل الإضافية بشكل منظم داخل بطاقة الطلب (الهدف، الفئة، عدد المستفيدين، الاستعجال)
- إضافة زر "عرض بروفايل الجمعية" يوجه لـ `/profile/:association_id`

### 5. تحديث استعلامات الـ hooks
- إضافة الحقول الجديدة في `select` queries داخل `useGrantRequests.ts`

### الملفات المتأثرة:
- **Migration**: إضافة 4 أعمدة لجدول `grant_requests`
- `src/pages/MyGrants.tsx` — نموذج الإنشاء
- `src/pages/GrantRequests.tsx` — عرض للمانح (طلبات عامة)
- `src/pages/MyGrantRequests.tsx` — عرض للمانح (طلبات واردة)
- `src/hooks/useGrantRequests.ts` — الاستعلامات و mutation

