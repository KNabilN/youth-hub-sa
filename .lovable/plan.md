

# إصلاح جذري للخط العربي في التقارير والفواتير

## المشكلة الجذرية
مكتبة `html2canvas` **لا تدعم** النص العربي بشكل صحيح — تعيد رسم النص حرفاً حرفاً بدون دعم الأشكال السياقية (ligatures) والاتصال بين الحروف. جميع محاولات الإصلاح السابقة عبر `unicode-bidi` لم تنجح لأن المشكلة في المحرك نفسه وليس في CSS.

## الحل: استبدال `html2canvas` بـ `html-to-image`
مكتبة `html-to-image` تستخدم SVG `foreignObject` الذي يُفوّض عملية الرسم لمحرك المتصفح الأصلي — وبالتالي النص العربي يظهر بشكل طبيعي تماماً.

### التغييرات:

**1. إضافة مكتبة `html-to-image`** (dependency جديدة)

**2. `src/lib/report-pdf.ts`**
- استبدال `import html2canvas` بـ `import { toPng } from 'html-to-image'`
- تعديل `renderSectionToImage` لاستخدام `toPng()` بدلاً من `html2canvas()`
- تعديل `captureChartAsImage` بنفس الطريقة
- إزالة `unicode-bidi: isolate` من الحاوية (لم تعد ضرورية)

**3. `src/lib/zatca-invoice.ts`**
- نفس الاستبدال: `html2canvas` → `toPng` من `html-to-image`
- تعديل `renderHtmlToImage` لإرجاع data URL مباشرة بدلاً من canvas

**4. `src/lib/pdf-utils.ts`**
- تبسيط `bdiTag()` — لم نعد بحاجة لحيل bidi لأن المتصفح يعالج النص بشكل صحيح

### الملفات المتأثرة:
- `package.json` — إضافة `html-to-image`
- `src/lib/report-pdf.ts` — استبدال html2canvas
- `src/lib/zatca-invoice.ts` — استبدال html2canvas
- `src/lib/pdf-utils.ts` — تبسيط bdiTag

