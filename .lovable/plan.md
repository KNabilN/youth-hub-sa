

# عكس ترتيب التبويبات لتبدأ من أقصى اليمين

## التغيير
في `src/pages/Trash.tsx` سطر 87، إضافة `flex-row-reverse` و `justify-end` للـ `TabsList` لتبدأ التبويبات من أقصى اليمين بدلاً من اليسار.

```typescript
<TabsList className="flex-wrap h-auto gap-1 flex-row-reverse justify-end">
```

البيانات أسفل التبويبات تبقى كما هي بدون تغيير.

### ملف متأثر واحد

| الملف | التغيير |
|-------|---------|
| `src/pages/Trash.tsx` | إضافة `flex-row-reverse justify-end` للتبويبات |

