

# إصلاح خطأ تصدير PDF — مشكلة تحميل الخط

## السبب
`@react-pdf/renderer` لا يستطيع تحميل الخط من مسار نسبي (`/fonts/Cairo-Variable.ttf`) — يحتاج رابط مطلق (absolute URL) أو رابط CDN.

## الحل
تغيير مصدر الخط في `src/lib/pdf-fonts.ts` لاستخدام رابط TTF مباشر من Google Fonts CDN:

```
https://fonts.gstatic.com/s/cairo/v28/SLXvx02YPrSQRIl0HxtFhn5kZg.ttf
```

### الملف المتأثر:
- `src/lib/pdf-fonts.ts` — تغيير `src` في `Font.register` من المسار النسبي إلى رابط CDN

