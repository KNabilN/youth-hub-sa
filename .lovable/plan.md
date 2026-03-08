

# استبدال html-to-image بـ @react-pdf/renderer

## المشكلة
مكتبة `html-to-image` تفشل في تصيير النص العربي بشكل صحيح (حروف مفككة / صفحات بيضاء) لأنها تعتمد على SVG `foreignObject` الذي لا يدعم الشكل السياقي العربي بشكل موثوق.

## الحل
استبدال كامل لـ `html-to-image` + `jsPDF` بـ `@react-pdf/renderer` الذي يولد PDF مباشرة من مكونات React، مع استخدام `arabic-reshaper` لإصلاح ربط الحروف العربية.

## المكتبات المطلوبة
- `@react-pdf/renderer` — محرك PDF مبني على React
- `arabic-reshaper` — إعادة تشكيل الحروف العربية لتظهر متصلة

## الملفات الجديدة

### 1. `src/lib/pdf-fonts.ts`
- تسجيل خط Cairo عبر `Font.register()` بأوزان 400 و 700
- دالة مساعدة `reshapeAr(text)` تستخدم `arabic-reshaper` لإصلاح ربط الحروف

### 2. `src/components/pdf/ReportDocument.tsx`
- مكون React يستخدم `Document`, `Page`, `View`, `Text` من `@react-pdf/renderer`
- يستقبل نفس البيانات الحالية: `title`, `dateRange`, `sections`, `summaryStats`, `chartImages`
- تصميم يحاكي التصميم الحالي: غلاف، هيدر، بطاقات إحصائيات (شبكة 2×4)، جداول بيانات، فوتر
- جميع النصوص العربية تمر عبر `reshapeAr()` قبل العرض
- الرسوم البيانية تُضمن كصور عبر `Image` component

### 3. `src/components/pdf/InvoiceDocument.tsx`
- مكون React للفواتير يستقبل `InvoiceData` و `InvoiceTemplateConfig`
- يحاكي تصميم الفاتورة الحالي: شريط ذهبي، هيدر مع لوجو، بيانات البائع، جدول البنود، الإجمالي
- نفس لوحة الألوان (Teal + Gold)

## الملفات المعدّلة

### 4. `src/lib/report-pdf.ts`
- إزالة `toPng`, `jsPDF`, `html-to-image` بالكامل
- استبدال `generateReportPDF` باستخدام `pdf(<ReportDocument />).toBlob()` ثم تحميل الملف
- `captureChartAsImage` تبقى كما هي (تلتقط الرسوم البيانية كصور لتضمينها)

### 5. `src/lib/zatca-invoice.ts`
- إزالة `toPng`, `jsPDF`, `renderHtmlToImage` بالكامل
- استبدال `generateInvoicePDF` باستخدام `pdf(<InvoiceDocument />).toBlob()`

### 6. `src/lib/pdf-utils.ts`
- إزالة `loadArabicFont()` (لم تعد مطلوبة — الخط يُسجل عبر `Font.register`)
- إبقاء `BRAND`, `getLogoBase64`, `generateRefNumber`
- إزالة `bdiTag`, `bidi` (لم تعد مطلوبة)

### 7. `package.json`
- إزالة `html-to-image` و `jspdf`
- إضافة `@react-pdf/renderer` و `arabic-reshaper`

## التصميم البصري
- نفس لوحة الألوان: Teal (#0f766e) للعناوين والأرقام، Gold (#b59535) للأشرطة الزخرفية
- شبكة بطاقات 2×4 للإحصائيات باستخدام flexbox
- جداول بيانات بألوان صفوف متناوبة
- اللوجو في الهيدر والفوتر
- اتجاه RTL كامل

## ملاحظات تقنية
- `@react-pdf/renderer` يدعم flexbox فقط (لا CSS Grid) — سنستخدم `flexWrap: 'wrap'` للشبكات
- الرسوم البيانية تبقى كصور ملتقطة من DOM (نفس `captureChartAsImage`)
- `arabic-reshaper` يعالج ربط الحروف، واتجاه RTL يُضبط عبر خاصية `textAlign: 'right'`

