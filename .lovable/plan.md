

# إضافة جميع بيانات الطلبات للتصدير + إصلاح صيغة الملف

## المشكلة
1. تصدير الطلبات يفتقد حقول مهمة (الوصف، الساعات المقدرة، المهارات، مزود الخدمة، مميز، إلخ)
2. زر التصدير لا يزال يقول "تصدير CSV" والملف اسمه `projects.csv` رغم أن `ExportDialog` يصدّر XLSX فعلياً

## التغييرات في `src/pages/admin/AdminProjects.tsx`

### 1. توسيع أعمدة التصدير
إضافة الأعمدة التالية:
- **الوصف** (`description`)
- **الساعات المقدرة** (`estimated_hours`)
- **المهارات المطلوبة** (`required_skills`)
- **مزود الخدمة** (`provider`)
- **مميز** (`is_featured`)
- **خاص** (`is_private`)
- **إظهار الاسم** (`is_name_visible`)
- **سبب الرفض** (`rejection_reason`)
- **تاريخ التحديث** (`updated_at`)

### 2. تحديث استعلام التصدير
```
select("*, profiles!projects_association_id_fkey(full_name, organization_name), 
        provider:profiles!projects_assigned_provider_id_fkey(full_name, organization_name),
        categories(name), regions(name), cities(name)")
```

### 3. إصلاح نص الزر واسم الملف
- تغيير `"تصدير CSV"` → `"تصدير Excel"` في الزر
- تغيير `filename="projects.csv"` → `filename="projects.xlsx"`

### ملف متأثر واحد

| الملف | التغيير |
|-------|---------|
| `src/pages/admin/AdminProjects.tsx` | توسيع أعمدة + إصلاح نص الزر واسم الملف |

