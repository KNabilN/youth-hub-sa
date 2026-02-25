
# المرحلة 14: تحسين الصفحة الرئيسية (Landing Page) مع احصائيات حية وخدمات مميزة

## الهدف
تحويل الصفحة الرئيسية من صفحة ثابتة تعتمد على محتوى CMS فقط الى صفحة احترافية تعرض بيانات حية من قاعدة البيانات: احصائيات المنصة الفعلية، اخر الخدمات المعتمدة، واخر المشاريع المفتوحة.

---

## التغييرات المخططة

### 1. انشاء Hook جديد: `useLandingStats`
**ملف:** `src/hooks/useLandingStats.ts`

يجلب احصائيات حية من قاعدة البيانات:
- عدد مقدمي الخدمات (من `user_roles` حيث role = service_provider)
- عدد الجمعيات المسجلة (role = youth_association)
- عدد المشاريع المكتملة (status = completed)
- عدد الخدمات المعتمدة (approval = approved)

يجلب ايضا:
- اخر 6 خدمات معتمدة مع بيانات التصنيف والمنطقة ومقدم الخدمة
- اخر 4 مشاريع مفتوحة مع بيانات الجمعية

### 2. انشاء مكون عرض الخدمات المميزة: `FeaturedServices`
**ملف:** `src/components/landing/FeaturedServices.tsx`

- شبكة بطاقات (3 اعمدة على الشاشات الكبيرة) تعرض اخر الخدمات
- كل بطاقة تعرض: العنوان، الوصف المختصر، السعر، التصنيف، اسم مقدم الخدمة
- بطاقات للعرض فقط (بدون زر اضافة للسلة) مع رابط لتسجيل الدخول
- تصميم متناسق مع نمط ServiceCard الحالي لكن مبسط للزوار

### 3. انشاء مكون عرض المشاريع المفتوحة: `FeaturedProjects`
**ملف:** `src/components/landing/FeaturedProjects.tsx`

- شبكة بطاقات (2 اعمدة) تعرض اخر المشاريع المفتوحة
- كل بطاقة تعرض: العنوان، الوصف، الميزانية، المهارات المطلوبة
- زر "سجل للتقديم" يوجه لصفحة التسجيل

### 4. انشاء مكون الاحصائيات الحية: `LiveStats`
**ملف:** `src/components/landing/LiveStats.tsx`

- يعرض 4 مؤشرات رقمية متحركة (animated counters)
- ايقونات مخصصة لكل مؤشر (Users, Store, FolderKanban, CheckCircle)
- تاثير عد تصاعدي عند ظهور القسم

### 5. تحديث الصفحة الرئيسية: `Index.tsx`
**ملف:** `src/pages/Index.tsx`

اضافة 3 اقسام جديدة بين الاقسام الحالية:
1. **قسم الاحصائيات الحية** - يعرض `LiveStats` بعد قسم Hero مباشرة (يحل محل قسم Stats الحالي اذا كان فارغا او يكمله)
2. **قسم الخدمات المميزة** - يعرض `FeaturedServices` بعد قسم Features
3. **قسم المشاريع المتاحة** - يعرض `FeaturedProjects` قبل قسم CTA

الترتيب النهائي للصفحة:
```text
Header
  |
Hero (CMS)
  |
Live Stats (DB) / Stats (CMS)
  |
Features (CMS)
  |
Featured Services (DB) -- جديد
  |
Trust (CMS)
  |
Featured Projects (DB) -- جديد
  |
CTA (CMS)
  |
Footer
```

---

## التفاصيل التقنية

### useLandingStats Hook
```typescript
// يستخدم 3 استعلامات منفصلة بـ useQuery:
// 1. احصائيات: COUNT من user_roles + projects + micro_services
// 2. خدمات مميزة: SELECT مع join على categories, regions, profiles
// 3. مشاريع مفتوحة: SELECT مع join على profiles (association)
// staleTime: 10 دقائق (بيانات عامة لا تحتاج تحديث مستمر)
```

### لا حاجة لتغييرات في قاعدة البيانات
جميع الجداول والسياسات موجودة:
- `micro_services` لديها سياسة "Browse approved services" للقراءة العامة
- `projects` تحتاج سياسة عامة للمشاريع المفتوحة (سيتم اضافتها)
- `user_roles` و`profiles` يمكن عدها عبر functions

### تغيير مطلوب في قاعدة البيانات
اضافة دالة PostgreSQL `get_landing_stats()` تعيد الاحصائيات بشكل امن بدون كشف بيانات حساسة:
```sql
CREATE FUNCTION public.get_landing_stats()
RETURNS json AS $$
  SELECT json_build_object(
    'providers', (SELECT count(*) FROM user_roles WHERE role='service_provider'),
    'associations', (SELECT count(*) FROM user_roles WHERE role='youth_association'),
    'completed_projects', (SELECT count(*) FROM projects WHERE status='completed'),
    'approved_services', (SELECT count(*) FROM micro_services WHERE approval='approved')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### الملفات المتاثرة
| ملف | نوع التغيير |
|-----|-------------|
| `src/hooks/useLandingStats.ts` | انشاء جديد |
| `src/components/landing/FeaturedServices.tsx` | انشاء جديد |
| `src/components/landing/FeaturedProjects.tsx` | انشاء جديد |
| `src/components/landing/LiveStats.tsx` | انشاء جديد |
| `src/pages/Index.tsx` | تعديل - اضافة الاقسام الجديدة |
| Migration SQL | انشاء دالة `get_landing_stats` |
