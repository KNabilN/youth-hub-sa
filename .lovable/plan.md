

# إضافة جميع بيانات الخدمة لتصدير CSV

## التغييرات في `src/pages/admin/AdminServices.tsx`

### 1. توسيع أعمدة التصدير
إضافة الأعمدة التالية إلى `serviceExportColumns`:
- **الوصف** (`description`)
- **الوصف التفصيلي** (`long_description`)
- **نوع الخدمة** (`service_type`) — ثابت/بالساعة
- **المنطقة** (`region`)
- **المدينة** (`city`)
- **عدد المبيعات** (`sales_count`)
- **عدد المشاهدات** (`service_views`)
- **مميزة** (`is_featured`)
- **تاريخ التحديث** (`updated_at`)

### 2. تحديث استعلام التصدير
تعديل `select` في `onExport` ليجلب الحقول الإضافية:
```
select("*, categories(name), regions(name), cities(name), profiles!micro_services_provider_id_fkey(full_name)")
```

### 3. إضافة mapper لكل عمود جديد
تعريف دوال التحويل للأعمدة الجديدة في `colMap`.

### ملف متأثر واحد فقط
| الملف | العملية |
|-------|---------|
| `src/pages/admin/AdminServices.tsx` | تعديل — توسيع أعمدة وبيانات التصدير |

