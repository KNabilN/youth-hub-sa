
# تحسين تصدير PDF ليطابق شكل لوحة التحكم بالضبط مع دعم كامل للعربية

## المشكلة الحالية
النص العربي في ملف PDF المُصدَّر يظهر مكسوراً/معكوساً (كما يظهر في الصورة المرفقة)، خاصة في بطاقات الإحصائيات. السبب أن الحاوية المخفية تستخدم `direction: ltr` والخط العربي غير محمّل بشكل صحيح قبل التقاط الصورة.

## الحل

### تعديل `src/lib/report-pdf.ts`

1. **تحميل خط عربي (Cairo) من Google Fonts قبل التقاط الصور**
   - إضافة دالة `loadArabicFont()` تقوم بتحميل خط Cairo عبر `@import` أو `FontFace API`
   - انتظار تحميل الخط قبل بدء عملية html2canvas
   - تغيير `BASE_FONT` ليستخدم `'Cairo'` كخط أساسي

2. **إصلاح اتجاه النص في الحاوية المخفية**
   - تغيير `direction: ltr` إلى `direction: rtl` في `createOffscreenContainer`
   - إضافة `unicode-bidi: bidi-override` للتأكد من عرض النص بشكل صحيح

3. **تحسين عرض بطاقات الإحصائيات**
   - إضافة `direction: rtl` و `text-align: center` لكل بطاقة
   - التأكد من أن التسميات والأرقام تظهر بوضوح

4. **استدعاء `loadArabicFont()` في بداية `generateReportPDF`**
   - ضمان تحميل الخط مرة واحدة قبل أي عملية تصيير

### تعديل `src/pages/admin/AdminReports.tsx`

5. **لا تغييرات جوهرية** - الملف يعمل بشكل صحيح، التعديل فقط في طبقة PDF

## التفاصيل التقنية

```text
generateReportPDF()
  |
  +-- loadArabicFont()  <-- جديد: تحميل خط Cairo
  |
  +-- renderSectionToImage(headerHTML)
  |     |
  |     +-- createOffscreenContainer()  <-- إصلاح: direction: rtl
  |     +-- html2canvas()  <-- الخط العربي محمّل مسبقاً
  |
  +-- (بقية الأقسام كما هي)
```

التعديل يقتصر على ملف واحد (`src/lib/report-pdf.ts`) ويحل مشكلة النص العربي المكسور في جميع أقسام التقرير.
