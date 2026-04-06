

# تمكين الأدمن من حذف التصنيفات

## المشكلة
عند محاولة حذف تصنيف، يظهر خطأ "لا يمكن حذف التصنيف" لأن هناك قيود مفتاح أجنبي (Foreign Key) من جدولي `projects` و `micro_services` تمنع الحذف إذا كان التصنيف مرتبطاً بأي مشروع أو خدمة.

## الحل
تعديل قيود المفتاح الأجنبي لتُفرّغ (`SET NULL`) حقل `category_id` بدلاً من منع الحذف:

### Migration جديد
```sql
ALTER TABLE projects DROP CONSTRAINT projects_category_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE micro_services DROP CONSTRAINT micro_services_category_id_fkey;
ALTER TABLE micro_services ADD CONSTRAINT micro_services_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
```

هذا يعني عند حذف تصنيف، ستُفرّغ قيمة `category_id` في المشاريع والخدمات المرتبطة به بدلاً من رفض الحذف.

| الملف | التغيير |
|-------|---------|
| Migration جديد | تعديل FK constraints لـ `ON DELETE SET NULL` |

لا حاجة لتعديل أي كود في الواجهة — الزر وكود الحذف موجودان فعلاً.

