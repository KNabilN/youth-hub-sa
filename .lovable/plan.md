

# خطة: إضافة تبويب الفرضيات للأدمن

## ملخص
إنشاء صفحة إدارية جديدة `/admin/hypotheses` تعرض 26 فرضية من الملف المرفوع بشكل إبداعي وتفاعلي، مع حساب مؤشرات آلية من بيانات النظام الفعلية حيثما أمكن.

## التصميم
الصفحة ستحتوي على:

1. **ملخص علوي** — 5 بطاقات KPI تُظهر عدد الفرضيات حسب الحالة: "تم التحقق" / "قيد الاختبار" / "لم تُختبر" / "لم تتحقق" + نسبة التقدم الإجمالية
2. **تبويبات حسب المجال** — 4 تبويبات: مزوّدي الخدمات (10) | الجمعيات (7) | نموذج العمل (4) | التشغيل والحوكمة (5)
3. **بطاقة لكل فرضية** تعرض:
   - رقم الفرضية + نص الفرضية
   - "ماذا نقيس" + "طريقة الاختبار" + "معيار النجاح" كتفاصيل قابلة للطي (Collapsible)
   - شريط تقدم ملون (أحمر/أصفر/أخضر) حسب الحالة
   - حقل حالة (Select): لم تُختبر / قيد الاختبار / تم التحقق / لم تتحقق
   - حقل ملاحظات نصي + قيمة فعلية للمؤشر
   - بعض الفرضيات ستعرض **مؤشرات آلية** من قاعدة البيانات (مثل: نسبة التقييم 4/5+، نسبة العمليات بلا نزاع، نسبة الدفع الذاتي)

## التغييرات

### 1. Migration — جدول `hypotheses`
إنشاء جدول لتخزين حالة كل فرضية وملاحظات الأدمن:
```sql
CREATE TABLE hypotheses (
  id serial PRIMARY KEY,
  hypothesis_number int NOT NULL UNIQUE,
  domain text NOT NULL,
  hypothesis text NOT NULL,
  metric text NOT NULL,
  test_method text NOT NULL,
  success_criteria text NOT NULL,
  status text NOT NULL DEFAULT 'not_tested',
  actual_value text DEFAULT '',
  admin_notes text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
```
+ RLS: admin-only CRUD
+ Insert 26 صفوف من البيانات

### 2. صفحة جديدة `src/pages/admin/AdminHypotheses.tsx`
- جلب الفرضيات من الجدول
- جلب مؤشرات آلية (ratings 4/5+, disputes ratio, escrow success, etc.)
- عرض بطاقات KPI + تبويبات المجالات + بطاقات الفرضيات
- تحديث الحالة والملاحظات والقيمة الفعلية مباشرة

### 3. Hook `src/hooks/useHypotheses.ts`
- `useHypotheses()` — جلب كل الفرضيات
- `useUpdateHypothesis()` — تحديث حالة/ملاحظات فرضية
- `useHypothesisMetrics()` — حساب مؤشرات آلية من الجداول الموجودة

### 4. تحديث `App.tsx`
- إضافة route `/admin/hypotheses`

### 5. تحديث `AppSidebar.tsx`
- إضافة رابط "الفرضيات" في قائمة `super_admin`

## ملخص الملفات

| الملف | التغيير |
|---|---|
| Migration | جدول `hypotheses` + 26 صف بيانات + RLS |
| `src/pages/admin/AdminHypotheses.tsx` | صفحة جديدة |
| `src/hooks/useHypotheses.ts` | hooks جديدة |
| `src/App.tsx` | route جديد |
| `src/components/AppSidebar.tsx` | رابط في القائمة |

