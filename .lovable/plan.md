

# نقل رسائل التنبيه (Toast) لأعلى منتصف الصفحة

## التغيير
تعديل ملف واحد فقط: `src/components/ui/sonner.tsx` — إضافة `position="top-center"` لمكون Sonner، مما ينقل جميع رسائل الخطأ والنجاح لأعلى منتصف الصفحة بدلاً من أسفل يمين الصفحة.

## الملف المتأثر
| الملف | التغيير |
|---|---|
| `src/components/ui/sonner.tsx` | إضافة `position="top-center"` + تكبير حجم الخط قليلاً للوضوح |

## التفاصيل
```tsx
<Sonner
  position="top-center"
  theme={theme as ToasterProps["theme"]}
  // ...
/>
```

تغيير سطر واحد يؤثر على جميع رسائل التنبيه في المنصة.

