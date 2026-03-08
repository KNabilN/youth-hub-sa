

# إصلاح التقرير الفارغ (صفحات بيضاء)

## المشكلة
بعد الانتقال من `html2canvas` إلى `html-to-image`، التقرير يطلع صفحات بيضاء بالكامل. السبب: مكتبة `html-to-image` تستخدم SVG `foreignObject` الذي لا يعمل بشكل صحيح مع عناصر `position: fixed` المخفية خارج الشاشة (`top: -99999px`).

## الحل
تغيير طريقة إخفاء الحاوية المؤقتة من `position: fixed; top: -99999px` إلى `position: absolute; opacity: 0; pointer-events: none; z-index: -1` — هذا يبقي العنصر في الـ DOM بشكل يسمح لـ `html-to-image` بتصييره بنجاح.

## الملفات المتأثرة

### 1. `src/lib/report-pdf.ts`
- تعديل `createOffscreenContainer()`: استبدال `position: fixed; top: -99999px; left: -99999px` بـ `position: absolute; left: 0; top: 0; opacity: 0; pointer-events: none; z-index: -1; overflow: hidden`

### 2. `src/lib/zatca-invoice.ts`
- نفس التعديل على `renderHtmlToImage()`: تغيير طريقة إخفاء الحاوية

