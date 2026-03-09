

# جعل التصنيف إجباري + ربط المهارات بالتصنيف المختار

## المشكلة
- حقل التصنيف في نموذج إنشاء المشروع اختياري حالياً
- المهارات مجرد حقل نص حر بدون أي اقتراحات مرتبطة بالتصنيف

## الحل

### 1. جدول جديد `category_skills` (Migration)
```sql
CREATE TABLE category_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);
ALTER TABLE category_skills ENABLE ROW LEVEL SECURITY;
-- قراءة عامة + إدارة الأدمن
CREATE POLICY "Public read category skills" ON category_skills FOR SELECT USING (true);
CREATE POLICY "Admin manage category skills" ON category_skills FOR ALL USING (has_role(auth.uid(), 'super_admin'));
```

ثم إدخال مهارات أولية لبعض التصنيفات الموجودة (يمكن للأدمن إضافة المزيد لاحقاً).

### 2. Hook جديد `useCategorySkills`
- `src/hooks/useCategorySkills.ts` — يستعلم من `category_skills` حسب `category_id`

### 3. تعديل `ProjectForm.tsx`
- **التصنيف إجباري**: تغيير schema من `optional().nullable()` إلى `z.string().min(1, "اختر التصنيف")`
- إضافة `required` على label التصنيف
- **المهارات**: عند اختيار تصنيف، يظهر قائمة المهارات المرتبطة كأزرار/badges قابلة للنقر (toggle) فوق حقل الإدخال اليدوي
- المستخدم يقدر يختار من القائمة أو يكتب مهارة جديدة

### 4. تحديث validation في `canNext`
- إضافة `category_id` للتحقق في الخطوة الأولى

### الملفات المتأثرة:
- **Migration**: إنشاء جدول `category_skills` + بيانات أولية
- `src/hooks/useCategorySkills.ts` — جديد
- `src/components/projects/ProjectForm.tsx` — تصنيف إجباري + مهارات مقترحة
- `src/components/services/ServiceForm.tsx` — نفس المنطق لو حبينا (التصنيف إجباري بالفعل هناك)

