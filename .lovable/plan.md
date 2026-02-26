

# إضافة تسميات بيانات ثابتة على الرسوم البيانية (Data Labels)

## المشكلة
عند تصدير التقارير بصيغة PDF، لا تظهر أي قيم على الرسوم البيانية لأن Tooltips تعمل فقط عند التفاعل بالماوس. هذا يجعل التقارير المطبوعة غير مفيدة بدون الأرقام.

## الحل
إضافة تسميات بيانات ثابتة (static data labels) على جميع الرسوم البيانية باستخدام خاصية `label` المخصصة في recharts.

---

## الملفات المتأثرة

### 1. `src/pages/admin/AdminReports.tsx` (13 رسم بياني)

**إنشاء مكونات Label مخصصة:**

- `renderBarLabel`: يعرض القيمة فوق كل عمود بلون داكن عالي التباين، حجم خط 11px، مع `toLocaleString()` للأرقام الكبيرة
- `renderPieLabel`: يعرض النسبة المئوية والقيمة داخل أو خارج شريحة الدائرة حسب الحجم، مع حساب الموضع بناءً على زاوية الشريحة لتجنب التداخل

**التغييرات على كل نوع:**

**BarChart (7 رسوم):**
- إضافة `<LabelList>` من recharts مع `position="top"` وتنسيق مخصص
- الخط: `fontSize: 11`, `fontWeight: 600`, `fill: "hsl(var(--foreground))"`

**PieChart (3 رسوم):**
- استبدال `label` الافتراضي بدالة `renderPieLabel` مخصصة تعرض القيمة العددية
- استخدام `labelLine={false}` لتجنب الفوضى البصرية مع الدوائر الصغيرة

### 2. `src/components/admin/AdminOverview.tsx` (2 AreaChart)

**AreaChart (2 رسم):**
- إضافة `<LabelList>` على آخر Area في كل رسم بياني مع `position="top"` لعرض القيم على نقاط البيانات
- حجم خط أصغر (10px) لتجنب التداخل مع الخطوط

---

## التفاصيل التقنية

### مكون renderBarLabel
```text
function renderBarLabel(props):
  - يأخذ x, y, width, value من props
  - يعرض <text> فوق العمود بمقدار 10px
  - يستخدم textAnchor="middle" للتوسيط
  - يتجاهل القيم الصفرية (لا يعرضها)
  - يستخدم toLocaleString() للأرقام الكبيرة
```

### مكون renderPieLabel
```text
function renderPieLabel(props):
  - يحسب موضع النص بناءً على midAngle و outerRadius
  - يعرض القيمة خارج الشريحة بمسافة صغيرة
  - يستخدم cos/sin لحساب x, y
  - يتجاهل الشرائح الصغيرة جداً (percent < 5%)
```

### تنسيق التسميات
- لون النص: `#374151` (رمادي داكن) لضمان التباين العالي
- حجم الخط: 11px للأعمدة، 10px للدوائر والمساحات
- وزن الخط: 600 (semi-bold)
- عدم عرض القيم الصفرية لتجنب الفوضى

### ملخص التغييرات

| الملف | نوع الرسم | التغيير |
|-------|----------|---------|
| `AdminReports.tsx` | 7 BarChart | إضافة LabelList position="top" |
| `AdminReports.tsx` | 3 PieChart | استبدال label بدالة مخصصة تعرض القيمة |
| `AdminOverview.tsx` | 2 AreaChart | إضافة LabelList على نقاط البيانات |
