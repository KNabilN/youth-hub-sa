# خطة شاملة لبناء صفحة الملف الشخصي العام للكيانات (مزودي الخدمات والجمعيات والجهات المانحة)

## الهدف

بناء صفحة ملف شخصي عام (Public Profile) لكل كيان مشابهة لصفحة الموقع القديم، تحتوي على: صورة غلاف، شعار، نبذة، مهارات، خدمات، معرض أعمال، مؤهلات، وتقييمات. مع إمكانية تعديل الملف من قبل صاحبه والمدير.

## ما هو موجود حالياً

- صفحة ملف المزود (`/providers/:id`) - بسيطة، تتطلب تسجيل دخول
- صفحة ملف الجمعية (`/associations/:id`) - تتطلب تسجيل دخول
- صفحة الملف الشخصي (`/profile`) - تعديل البيانات الأساسية فقط
- معرض أعمال (Portfolio) - موجود ويعمل
- لا توجد حقول للمهارات أو المؤهلات أو صورة الغلاف في قاعدة البيانات

## التغييرات المطلوبة

### 1. تحديث قاعدة البيانات (Migration)

إضافة حقول جديدة لجدول `profiles`:

- `cover_image_url` (text) - صورة الغلاف/البانر
- `skills` (text[]) - المهارات كمصفوفة نصية
- `qualifications` (jsonb) - المؤهلات (عنوان + وصف اختياري لكل مؤهل)
- `profile_views` (integer, default 0) - عدد المشاهدات

إنشاء جدول `profile_saves` لميزة "حفظ" الملف الشخصي:

```text
profile_saves (
  id uuid PK,
  user_id uuid (من يحفظ),
  profile_id uuid (الملف المحفوظ),
  created_at timestamp,
  UNIQUE(user_id, profile_id)
)
```

مع سياسات RLS مناسبة:

- المستخدم يدير حفظه الخاص
- قراءة عامة للعدد فقط

إضافة storage bucket جديد:

- `cover-images` (عام) لصور الغلاف

### 2. صفحة الملف الشخصي العام (Public Profile)

إنشاء صفحة جديدة `src/pages/PublicProfile.tsx` موحدة لمزودي الخدمات والجمعيات:

- متاحة بدون تسجيل دخول على المسار `/profile/:id`
- تستخدم `PublicLayout` (نفس هيدر وفوتر الصفحة الرئيسية)

**هيكل الصفحة:**

```text
+--------------------------------------------------+
| صورة الغلاف (Banner)                              |
| +----------------------------------------------+ |
| |  صورة كبيرة بعرض كامل، ارتفاع ~300px        | |
| +----------------------------------------------+ |
+--------------------------------------------------+
| [الشعار/الصورة]  الاسم + التوثيق                 |
|                   الوصف المختصر                   |
|                   التقييم + المشاهدات + حفظ       |
+--------------------------------------------------+
| نبذة | المهارات | الخدمات | الأعمال | المؤهلات | التقييمات |
+--------------------------------------------------+
| [محتوى القسم المحدد حسب التاب النشط]             |
+--------------------------------------------------+
```

**الأقسام (Tabs):**

1. **نبذة** - النص التعريفي (bio)
2. **المهارات** - عرض المهارات كـ badges/tags
3. **الخدمات** - بطاقات الخدمات المعتمدة مع الصورة والسعر والتقييم
4. **جميع الأعمال** - معرض الأعمال (Portfolio) بتصميم شبكي
5. **المؤهلات** - قائمة المؤهلات والشهادات
6. **التقييمات** - التقييمات مع التوزيع والتعليقات

### 3. تحديث صفحة تعديل الملف الشخصي (`/profile`)

إضافة أقسام جديدة لصفحة Profile.tsx:

- **صورة الغلاف:** رفع صورة غلاف مع معاينة
- **المهارات:** إضافة/حذف مهارات كـ tags (نفس نمط إضافة المهارات في نموذج المشاريع)
- **المؤهلات:** إضافة/حذف مؤهلات (عنوان + وصف اختياري)

إنشاء hooks جديدة:

- `useUploadCover` - رفع صورة الغلاف إلى storage bucket
- تحديث `useUpdateProfile` لتشمل الحقول الجديدة (skills, qualifications)

### 4. صلاحيات المدير (Super Admin)

- المدير يستطيع تعديل أي ملف شخصي عبر `AdminDirectEditDialog` الموجود
- تحديث `AdminDirectEditDialog` لتشمل الحقول الجديدة (المهارات، المؤهلات، صورة الغلاف)
- سياسات RLS الحالية تدعم هذا بالفعل (Admins can update all profiles)

### 5. تحديث الروابط والتوجيه (Routing)

- إضافة مسار `/profile/:id` في PublicLayout (بدون تسجيل دخول)
- تحديث الروابط في بطاقات الخدمات والمشاريع للإشارة إلى الملف العام
- إزالة أو إعادة توجيه `/providers/:id` و `/associations/:id` إلى `/profile/:id`

### 6. عداد المشاهدات

- عند زيارة الملف العام، يتم تحديث `profile_views` عبر استدعاء RPC function
- دالة `increment_profile_views` (security definer) تزيد العداد بـ 1

## التفاصيل التقنية

### الملفات الجديدة:

1. `src/pages/PublicProfile.tsx` - الصفحة العامة الموحدة
2. `src/hooks/usePublicProfile.ts` - جلب بيانات الملف العام + الخدمات + التقييمات + الأعمال
3. `src/hooks/useUploadCover.ts` - رفع صورة الغلاف

### الملفات المعدلة:

1. `src/pages/Profile.tsx` - إضافة أقسام المهارات والمؤهلات وصورة الغلاف
2. `src/hooks/useProfile.ts` - تحديث mutation لتشمل الحقول الجديدة
3. `src/App.tsx` - إضافة مسار `/profile/:id` ضمن PublicLayout
4. `src/components/admin/AdminDirectEditDialog.tsx` - دعم الحقول الجديدة
5. `src/components/marketplace/ServiceCard.tsx` - ربط بالملف العام

### Migration SQL:

```text
ALTER TABLE profiles ADD COLUMN cover_image_url text DEFAULT '';
ALTER TABLE profiles ADD COLUMN skills text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN qualifications jsonb DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN profile_views integer DEFAULT 0;

CREATE TABLE profile_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_id)
);
ALTER TABLE profile_saves ENABLE ROW LEVEL SECURITY;
-- RLS policies for profile_saves

CREATE OR REPLACE FUNCTION increment_profile_views(p_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE profiles SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = p_id;
$$;

INSERT INTO storage.buckets (id, name, public) VALUES ('cover-images', 'cover-images', true);
```

### تصميم بطاقة الخدمة في الملف العام:

```text
+----------------------------+
| [صورة الخدمة]              |
| عنوان الخدمة               |
| التقييم: 5/5 (التقييمات)   |
| ابتداءً من 1,500 ر.س       |
+----------------------------+
```

### ترتيب التنفيذ:

1. Migration (إضافة الحقول + الجدول + الدالة + الـ bucket)
2. إنشاء hooks جديدة
3. بناء صفحة PublicProfile
4. تحديث صفحة Profile (إضافة أقسام التعديل)
5. تحديث الروابط والتوجيه
6. تحديث أدوات المدير