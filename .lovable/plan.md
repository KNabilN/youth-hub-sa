

# تعزيز صلاحيات الأدمن لتعديل جميع بيانات المستخدمين

## الملخص
تمكين المدير من تعديل جميع بيانات المستخدم بما في ذلك الصورة الشخصية وصورة الغلاف والمهارات والمؤهلات وسعر الساعة، مباشرة من صفحة تفاصيل المستخدم.

---

## التغييرات المطلوبة

### 1. إنشاء hooks للرفع الإداري (`src/hooks/useAdminUpload.ts`)

إنشاء hook جديد يسمح للأدمن برفع صورة شخصية وصورة غلاف لأي مستخدم (وليس فقط للمستخدم الحالي):

- `useAdminUploadAvatar(userId)` - رفع صورة شخصية لمستخدم محدد إلى bucket `avatars`
- `useAdminUploadCover(userId)` - رفع صورة غلاف لمستخدم محدد إلى bucket `cover-images`

كلاهما يقوم بـ:
1. رفع الملف إلى Storage
2. تحديث عمود `avatar_url` أو `cover_image_url` في profiles
3. إبطال cache الاستعلامات

### 2. تطوير `AdminDirectEditDialog` لدعم أنواع حقول إضافية

تحديث `src/components/admin/AdminDirectEditDialog.tsx`:

- إضافة نوع حقل `"avatar"` - يعرض الصورة الحالية مع زر رفع صورة جديدة
- إضافة نوع حقل `"cover"` - يعرض صورة الغلاف الحالية مع زر رفع
- إضافة نوع حقل `"skills"` - يعرض المهارات كـ badges مع إمكانية الإضافة والحذف
- إضافة نوع حقل `"qualifications"` - يعرض المؤهلات مع إمكانية الإضافة والحذف

تحديث `DirectEditFieldConfig`:
```text
type?: "text" | "textarea" | "number" | "select" | "avatar" | "cover" | "skills" | "qualifications"
```

### 3. تحديث حقول التعديل في `AdminUserDetail.tsx`

تعديل دالة `getProfileFieldsForRole` لتشمل جميع الحقول:

**لجميع الأدوار:**
- الصورة الشخصية (avatar)
- صورة الغلاف (cover)
- الاسم، الهاتف، النبذة
- المهارات (skills)
- المؤهلات (qualifications)

**لمقدمي الخدمات:**
- سعر الساعة (hourly_rate) - موجود حالياً

**للجمعيات:**
- اسم المنظمة، رقم الترخيص، بيانات ضابط الاتصال - موجودة حالياً

**للمانحين:**
- اسم المنظمة - موجود حالياً

### 4. تمرير `userId` إلى `AdminDirectEditDialog`

تعديل `AdminDirectEditDialog` ليقبل prop `userId` اختياري، يُستخدم لتحديد المستخدم المستهدف عند رفع الصور (بدلاً من المستخدم المسجّل حالياً).

---

## الملفات المتأثرة

| ملف | نوع التغيير |
|-----|-------------|
| `src/hooks/useAdminUpload.ts` | جديد - hooks رفع الصور للأدمن |
| `src/components/admin/AdminDirectEditDialog.tsx` | تعديل - دعم حقول avatar, cover, skills, qualifications |
| `src/pages/admin/AdminUserDetail.tsx` | تعديل - إضافة حقول الصور والمهارات والمؤهلات لـ getProfileFieldsForRole |

---

## ملاحظات تقنية

- رفع الصور يتم عبر Supabase Storage مباشرة (نفس آلية صفحة Profile الشخصية)
- يتم استخدام `upsert: true` لاستبدال الصورة القديمة تلقائياً
- يتم إضافة `?t=timestamp` لكسر cache المتصفح بعد رفع صورة جديدة
- المهارات والمؤهلات تُحفظ كـ JSON arrays في أعمدة `skills` و `qualifications`

