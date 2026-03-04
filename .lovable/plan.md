

## خطة: إعادة تصميم صفحة "تقارير الأثر" لعرض تقارير PDF من الجمعيات

### الفكرة
الصفحة الحالية تعرض إحصائيات وأرصدة المانح (وهي مكررة مع صفحة المنح ولوحة التحكم). المطلوب تحويلها إلى صفحة تعرض:
1. **ملخص سريع** عن منح المانح (عدد المنح، عدد الجمعيات، إجمالي المبالغ)
2. **قائمة تقارير الأثر** التي ترفعها الجمعيات المستفيدة كملفات PDF مرتبطة بالمنح/المشاريع

### التغييرات المطلوبة

#### 1. جدول قاعدة بيانات جديد: `impact_reports`
```sql
create table public.impact_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.donor_contributions(id) on delete cascade,
  project_id uuid references public.projects(id),
  association_id uuid not null,
  donor_id uuid not null,
  title text not null default '',
  description text default '',
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);
alter table public.impact_reports enable row level security;
```
- سياسات RLS: الجمعية ترفع وتدير تقاريرها، المانح يقرأ تقاريره، الأدمن يدير الكل

#### 2. Hook جديد: `useImpactReports`
- جلب تقارير الأثر للمانح (مع بيانات الجمعية والمشروع)
- جلب عدد التقارير لعرضه في لوحة التحكم

#### 3. إعادة تصميم `ImpactReports.tsx`
- **قسم علوي**: 3 بطاقات ملخص (إجمالي المنح، عدد الجمعيات، عدد التقارير)
- **قسم رئيسي**: قائمة بطاقات التقارير، كل بطاقة تعرض:
  - اسم الجمعية + شعارها
  - عنوان التقرير + وصف مختصر
  - اسم المشروع المرتبط
  - تاريخ الرفع
  - زر تحميل/عرض PDF
- حالة فارغة مناسبة عند عدم وجود تقارير

#### 4. تحديث لوحة تحكم المانح (`Dashboard.tsx`)
- تحديث بطاقة "تقارير الأثر" لعرض العدد الفعلي بدلاً من "0"

### الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| migration SQL | جدول `impact_reports` + RLS |
| `src/hooks/useImpactReports.ts` | hook جديد |
| `src/pages/ImpactReports.tsx` | إعادة تصميم كامل |
| `src/pages/Dashboard.tsx` | عدد التقارير الفعلي |

