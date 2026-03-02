
# تحسين تصميم الصفحة الرئيسية بناءً على موقع قادرون

## الهدف
تعديل تصميم الصفحة الرئيسية ليتطابق مع نمط موقع recruitment.qaderoon.sa: بطاقات بتصميم نظيف مع أيقونات دائرية ملونة، وجعل جميع الأقسام بالعرض الكامل للصفحة.

## التغييرات المطلوبة

### 1. توسيع جميع الأقسام للعرض الكامل (`src/pages/Index.tsx`)
- تغيير `max-w-4xl` في Hero إلى `max-w-5xl`
- تغيير `max-w-5xl` في المميزات إلى `max-w-7xl`
- تغيير `max-w-3xl` في قسم الثقة إلى `max-w-6xl`
- تغيير `max-w-5xl` في CTA إلى `max-w-7xl`
- تغيير `max-w-3xl` في هيدر التواصل إلى `max-w-5xl`

### 2. تحسين بطاقات المميزات بنمط قادرون (`src/pages/Index.tsx`)
- أيقونات داخل دوائر ملونة كبيرة (w-20 h-20) بدلا من مربعات
- خلفية رمادية فاتحة (bg-muted/40) مع حدود خفيفة
- زيادة padding إلى p-10 والارتفاع min-h-[280px]
- نص عنوان أكبر (text-xl font-bold)

### 3. توسيع بطاقات الخدمات (`src/components/landing/LandingServicesGrid.tsx`)
- تغيير `max-w-5xl` إلى `max-w-7xl`
- زيادة padding البطاقات وتحسين التباعد

### 4. توسيع بطاقات الطلبات (`src/components/landing/LandingRequestsTable.tsx`)
- تغيير `max-w-5xl` إلى `max-w-7xl`

### 5. توسيع الإحصائيات (`src/components/landing/LiveStats.tsx`)
- تغيير `max-w-5xl` إلى `max-w-7xl`
- تكبير الأيقونات والأرقام

### 6. توسيع آراء العملاء (`src/components/landing/Testimonials.tsx`)
- تغيير `max-w-6xl` إلى `max-w-7xl`

### 7. توسيع نموذج التواصل (`src/components/landing/ContactForm.tsx`)
- تغيير `max-w-5xl` إلى `max-w-6xl`

### التفاصيل التقنية

**بطاقات المميزات (الأهم)** - تقليد نمط قادرون:
```text
+----------------------------------+
|                                  |
|         ( Icon Circle )          |
|          w-20 h-20               |
|     bg-primary/10 rounded-full   |
|                                  |
|        العنوان (text-xl)          |
|                                  |
|     الوصف (text-muted)           |
|                                  |
+----------------------------------+
  bg-muted/40  rounded-2xl  p-10
  border border-border/50
  min-h-[280px]
```

**الأقسام**: جميعها تستخدم `max-w-7xl` لتأخذ العرض الكامل تقريبا مع هوامش مناسبة.

**الملفات المتأثرة:**
- `src/pages/Index.tsx` (المميزات + الثقة + CTA + التواصل)
- `src/components/landing/LandingServicesGrid.tsx`
- `src/components/landing/LandingRequestsTable.tsx`
- `src/components/landing/LiveStats.tsx`
- `src/components/landing/Testimonials.tsx`
- `src/components/landing/ContactForm.tsx`
