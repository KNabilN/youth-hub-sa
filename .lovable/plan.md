
# اضافة المدن لكل منطقة

## الفكرة
انشاء جدول مدن مرتبط بالمناطق، بحيث كل منطقة تحتوي على عدة مدن. يتم استخدام المدينة في المشاريع والخدمات بجانب المنطقة، مع ربط الفلاتر بحيث اختيار المنطقة يُظهر مدنها فقط.

## قاعدة البيانات

### جدول جديد: `cities`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | uuid | المعرف |
| region_id | uuid (FK -> regions.id) | المنطقة التابعة لها |
| name | text | اسم المدينة |
| created_at | timestamp | تاريخ الانشاء |

### سياسات الأمان (RLS)
- القراءة عامة للجميع (مثل المناطق)
- الادارة للأدمن فقط

### تعديل الجداول الموجودة
- **micro_services**: اضافة عمود `city_id` (uuid, nullable, FK -> cities.id)
- **projects**: اضافة عمود `city_id` (uuid, nullable, FK -> cities.id)

## تعديلات الواجهة

### 1. RegionManager.tsx - ادارة المدن داخل كل منطقة
- اضافة زر توسيع (Collapsible) لكل منطقة لعرض مدنها
- امكانية اضافة/تعديل/حذف مدن لكل منطقة
- عرض عدد المدن بجانب كل منطقة

### 2. ProjectForm.tsx - اضافة اختيار المدينة
- اضافة حقل "المدينة" بعد حقل المنطقة
- الحقل يعتمد على المنطقة المختارة (تتغير الخيارات عند تغيير المنطقة)
- اضافة `city_id` في الـ schema

### 3. ServiceForm.tsx - اضافة اختيار المدينة
- نفس المنطق: حقل مدينة يعتمد على المنطقة المختارة
- اضافة `city_id` في الـ schema

### 4. ServiceFilters.tsx - فلتر المدينة
- اضافة فلتر مدينة جديد يظهر بعد فلتر المنطقة
- يتحدث الفلتر تلقائياً عند تغيير المنطقة

### 5. عرض المدينة في البطاقات والصفحات
- **ServiceCard.tsx**: عرض اسم المدينة بجانب المنطقة
- **ProjectCard.tsx**: عرض المدينة
- **ProviderProjectCard.tsx**: عرض المدينة
- **ServiceDetail page**: عرض المدينة
- **ProjectDetails page**: عرض المدينة

### 6. Hook جديد: useCities.ts
- جلب جميع المدن أو المدن حسب منطقة محددة

### 7. صفحات الادمن
- **AdminReports.tsx**: اضافة فلتر مدينة + تعديل الاستعلامات
- **AdminServices.tsx**: عرض المدينة + دعم التعديل المباشر
- **AdminProjects.tsx**: عرض المدينة

## التفاصيل التقنية

### سير العمل في الفورم
```text
المستخدم يختار المنطقة
  |
  +-- يتم جلب مدن هذه المنطقة فقط
  +-- يظهر حقل المدينة بالخيارات المفلترة
  +-- عند تغيير المنطقة يتم مسح المدينة المختارة
```

### استعلام المدن
```text
-- جلب مدن منطقة محددة
SELECT * FROM cities WHERE region_id = ? ORDER BY name

-- جلب خدمة مع المدينة
SELECT *, cities(*), regions(*) FROM micro_services WHERE ...
```

### الملفات المتأثرة
- **Migration**: جدول cities + أعمدة city_id في micro_services و projects
- **جديد**: `src/hooks/useCities.ts`
- **تعديل**: `src/components/admin/RegionManager.tsx` - ادارة المدن
- **تعديل**: `src/components/projects/ProjectForm.tsx` - حقل المدينة
- **تعديل**: `src/components/services/ServiceForm.tsx` - حقل المدينة
- **تعديل**: `src/components/marketplace/ServiceFilters.tsx` - فلتر المدينة
- **تعديل**: `src/components/marketplace/ServiceCard.tsx` - عرض المدينة
- **تعديل**: `src/components/projects/ProjectCard.tsx` - عرض المدينة
- **تعديل**: `src/components/provider/ProviderProjectCard.tsx` - عرض المدينة
- **تعديل**: `src/hooks/useServiceDetail.ts` - جلب المدينة
- **تعديل**: `src/hooks/useRegions.ts` - جلب المدن مع المناطق (اختياري)
- **تعديل**: `src/pages/ProjectDetails.tsx` - عرض المدينة
- **تعديل**: `src/pages/ProjectEdit.tsx` - تمرير city_id
- **تعديل**: `src/pages/admin/AdminReports.tsx` - فلتر مدينة
- **تعديل**: `src/pages/admin/AdminServices.tsx` - عرض المدينة
- **تعديل**: `src/pages/admin/AdminProjects.tsx` - عرض المدينة
