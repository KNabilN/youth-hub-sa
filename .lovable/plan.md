

# إصلاح الخط العربي في التقرير

## المشكلة
كما يظهر في الصور، النص العربي في التقرير (صفحة الغلاف، الهيدر، بطاقات الإحصائيات) يظهر مشوهاً/معكوساً. السبب الرئيسي هو استخدام `unicode-bidi: bidi-override` على الحاوية الرئيسية — هذه الخاصية تُلغي خوارزمية Unicode bidi بالكامل وتجبر كل الحروف على اتجاه واحد، مما يكسر تشكيل الحروف العربية في `html2canvas`.

## الحل — ملف واحد: `src/lib/report-pdf.ts`

### 1. إصلاح الحاوية المخفية `createOffscreenContainer`
- تغيير `unicode-bidi: bidi-override` → `unicode-bidi: isolate` 
- هذا يحافظ على اتجاه RTL دون إلغاء خوارزمية bidi التي تحتاجها الحروف العربية

### 2. إصلاح كل عنصر `bdiTag` 
- تغيير `unicode-bidi:isolate` داخل `bdiTag()` في `pdf-utils.ts` إلى `unicode-bidi:plaintext` لإعطاء html2canvas فرصة أفضل لقراءة اتجاه النص
- أو بديلاً: استخدام `unicode-bidi:embed` مع `direction:rtl` صريح

### 3. إضافة `-webkit-text-stroke: 0` وخصائص تصيير إضافية
- إضافة `text-rendering: optimizeLegibility` لتحسين تشكيل الحروف العربية
- إضافة `word-spacing: 2px` لمنع التصاق الكلمات

### الملفات المتأثرة:
- `src/lib/report-pdf.ts` — تغيير `bidi-override` → `isolate` في الحاوية
- `src/lib/pdf-utils.ts` — تحسين `bdiTag()` helper

