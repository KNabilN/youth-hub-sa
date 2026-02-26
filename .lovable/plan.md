
# تحسين الرسوم البيانية والتصورات البصرية - تصميم احترافي

## الملفات المتأثرة

### 1. `src/pages/admin/AdminReports.tsx` - الملف الرئيسي (13 رسم بياني)
التغييرات:
- **لوحة الألوان**: استبدال الألوان الحالية بلوحة احترافية: `#0D9488` (Deep Teal), `#F43F5E` (Rose), `#FB923C` (Orange), `#6366F1` (Indigo), `#8B5CF6` (Violet), `#64748B` (Slate)
- **عناوين الرسوم**: توسيط جميع `CardTitle` داخل `CardHeader` باستخدام `text-center`
- **أشرطة BarChart**: إضافة `radius={[6, 6, 0, 0]}` لزوايا دائرية علوية
- **Tooltip مخصص**: استبدال `<Tooltip />` الافتراضي بـ tooltip مخصص مع تصميم RTL متوافق
- **تدرجات لونية**: إضافة `<defs>` مع `<linearGradient>` لجميع الأشرطة
- **CartesianGrid**: تحديث اللون إلى `stroke="hsl(var(--border))"` مع `vertical={false}`
- **XAxis/YAxis**: إضافة `fontSize={12}` و `stroke="hsl(var(--muted-foreground))"` و `tickLine={false}` و `axisLine={false}`
- **الحاويات (Cards)**: إضافة `shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden`
- **animationDuration**: إضافة `animationDuration={800}` لجميع عناصر Bar و Pie
- **PieChart**: إضافة `innerRadius={40}` لتحويلها إلى Donut charts مع `paddingAngle={3}` و `cornerRadius={4}`

### 2. `src/components/admin/AdminOverview.tsx` - لوحة التحكم الرئيسية (2 AreaChart)
التغييرات:
- توسيط عناوين الرسوم البيانية
- تحديث Tooltip لاستخدام التصميم المخصص الموحد
- إضافة `strokeWidth={2.5}` و `dot={false}` للخطوط
- تحسين الظلال على بطاقات الرسوم

### 3. `src/components/ratings/RatingDistribution.tsx` - توزيع التقييمات
- لا تغييرات كبيرة مطلوبة (يستخدم أشرطة CSS مخصصة، ليس recharts)

### 4. `src/components/admin/FinanceSummary.tsx` - ملخص مالي
- لا يحتوي على رسوم بيانية recharts، فقط بطاقات KPI

---

## التفاصيل التقنية

### Tooltip المخصص الموحد
سيتم إنشاء مكون `CustomTooltip` مشترك في `AdminReports.tsx` يتميز بـ:
- خلفية `bg-popover` مع حدود ناعمة
- `border-radius: 12px` و `shadow-lg`
- محاذاة RTL مع `direction: rtl`
- خط عربي واضح

```text
+---------------------------+
|   التبرعات الشهرية        |  <-- centered bold title
|  ┌─────────────────────┐  |
|  │  ██████░░░░  12,000 │  |  <-- rounded bars with gradient
|  │  ████████░░  18,500 │  |
|  │  ██████████  25,000 │  |
|  └─────────────────────┘  |
+---------------------------+
```

### لوحة الألوان الجديدة
```text
STATUS_COLORS = ["#0D9488", "#FB923C", "#F59E0B", "#10B981", "#F43F5E", "#64748B"]
ROLE_COLORS   = ["#0D9488", "#FB923C", "#6366F1", "#8B5CF6"]
```

### أنماط البطاقات المحسنة
كل بطاقة رسم بياني ستحصل على:
- `rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300`
- `border border-border/50`
- padding موحد في `CardContent` بـ `p-6`

### التغييرات على كل نوع رسم:

**BarChart (7 رسوم):**
- `radius={[6, 6, 0, 0]}` على كل `<Bar>`
- تدرج لوني عمودي لكل عمود
- `animationDuration={800}` و `animationEasing="ease-out"`

**PieChart (3 رسوم):**
- تحويل إلى Donut: `innerRadius={45} outerRadius={85}`
- `paddingAngle={3}` و `cornerRadius={4}`
- `animationDuration={800}`

**AreaChart (2 رسوم في AdminOverview):**
- `strokeWidth={2.5}` و `dot={false}`
- توسيط العناوين
- تحسين Tooltip

### ملخص الملفات

| الملف | عدد الرسوم | نوع التغيير |
|-------|-----------|------------|
| `AdminReports.tsx` | 13 رسم | لوحة ألوان + زوايا + tooltip + تدرجات + عناوين |
| `AdminOverview.tsx` | 2 رسم | توسيط عناوين + تحسين tooltip |
