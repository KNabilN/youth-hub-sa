

## خطة: إضافة المنطقة والمدينة لبيانات الجمعيات ومزودي الخدمة

### 1. Migration — إضافة أعمدة `region_id` و `city_id` لجدول `profiles`
```sql
ALTER TABLE public.profiles
  ADD COLUMN region_id uuid REFERENCES public.regions(id) DEFAULT NULL,
  ADD COLUMN city_id uuid REFERENCES public.cities(id) DEFAULT NULL;
```

### 2. صفحة الملف الشخصي (`Profile.tsx`)
- إضافة state لـ `regionId` و `cityId`
- إضافة حقلي Select للمنطقة والمدينة (المدينة تتبع المنطقة المختارة)
- يظهران فقط لدور `youth_association` و `service_provider`
- استخدام `useRegions` و `useCities` الموجودين
- حفظهما ضمن `handleSave`

### 3. صفحة تفاصيل المستخدم في الأدمن (`AdminUserDetail.tsx`)
- عرض المنطقة والمدينة في قسم البيانات الأساسية باستخدام `InfoField`
- جلب أسماء المنطقة والمدينة عبر queries منفصلة أو ربطها مع الـ profile

### 4. تعديل الأدمن (`AdminDirectEditDialog`)
- إضافة حقلي region/city للـ `getProfileFieldsForRole` للأدوار المعنية
- دعم نوع جديد `region` و `city` في الـ dialog

### الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| Migration | إضافة `region_id`, `city_id` لـ profiles |
| `src/pages/Profile.tsx` | حقول اختيار المنطقة والمدينة |
| `src/pages/admin/AdminUserDetail.tsx` | عرض المنطقة والمدينة + تعديلها |
| `src/components/admin/AdminDirectEditDialog.tsx` | دعم حقول region/city |

