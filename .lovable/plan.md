

# إصلاح خطأ تصدير PDF

## السبب الجذري
مكتبة `@react-pdf/renderer` تدعم فقط خطوط **TTF** و **WOFF** — لكن الكود الحالي في `src/lib/pdf-fonts.ts` يسجل خط Cairo بصيغة **woff2** التي غير مدعومة، مما يسبب فشل صامت عند توليد PDF.

## الحل
تغيير روابط الخط في `Font.register()` من woff2 إلى TTF.

## التغييرات

### `src/lib/pdf-fonts.ts`
- استبدال رابطي خط Cairo (400 و 700) من صيغة `.woff2` إلى `.ttf` من Google Fonts CDN:
  - Weight 400: `https://fonts.gstatic.com/s/cairo/v28/SLXGc1nY6HkvalIkTp2mQ9DLRA.ttf`
  - Weight 700: `https://fonts.gstatic.com/s/cairo/v28/SLXGc1nY6HkvalIkTp2mQ9DLRA.ttf` (ملف TTF الصحيح لكل وزن)

### `src/pages/admin/AdminReports.tsx`
- إضافة `console.error(err)` داخل `catch` block لتسهيل التشخيص مستقبلاً

### ملف واحد يتأثر بشكل أساسي:
- `src/lib/pdf-fonts.ts` — تغيير صيغة الخط فقط

