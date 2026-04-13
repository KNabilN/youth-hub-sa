

# إضافة قوالب إيميلات المانحين (donor)

## التغييرات — ملف واحد

### `supabase/functions/send-notification-email/index.ts`

1. **إضافة دالة `getDonorBody`** بنفس نمط `getProviderBody` و `getAssociationBody`، تحتوي على 6 قوالب:

| النوع | العنوان |
|---|---|
| donation_received | تم استلام التبرع بنجاح |
| project_completed | تم إكمال المشروع المدعوم |
| grant_request_received | وصلكم طلب منحة جديد |
| bank_transfer_pending | طلب تحويل بنكي جديد بانتظار المراجعة |
| dispute_opened | تم تسجيل شكوى جديدة |
| contact_message | وردت رسالة تواصل جديدة |

2. **إضافة عناوين مخصصة للمانحين** في `ROLE_SUBJECT_OVERRIDES`:
   - `donation_received` → "تم استلام التبرع بنجاح"
   - `project_completed` → "تم إكمال المشروع المدعوم"
   - `grant_request_received` → "وصلكم طلب منحة جديد"
   - `bank_transfer_pending` → "طلب تحويل بنكي جديد بانتظار المراجعة"
   - `dispute_opened` → "تم تسجيل شكوى جديدة"
   - `contact_message` → "وردت رسالة تواصل جديدة"

3. **تحديث `getCustomBodyForRole`** لإضافة فرع `donor` يستدعي `getDonorBody`

4. **إضافة أنواع جديدة** في `CUSTOM_SUBJECTS` للأنواع غير الموجودة (`donation_received` و `contact_message` و `bank_transfer_pending`)

5. **ملاحظة خاصة**: قالب `donation_received` يحتوي على "(اسم الجمعية)" — سيتم جلب اسم الجمعية من `entity_type` إذا كان متاحاً، وإلا يُستخدم النص العام

6. **نشر الدالة** بعد التحديث

