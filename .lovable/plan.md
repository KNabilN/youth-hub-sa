

# عكس التبويبات لتبدأ من أقصى اليمين

## التغيير
التبويبات حالياً تحتوي على `flex-row-reverse justify-end` لكن `justify-end` في سياق `flex-row-reverse` يدفعها لليسار. المطلوب استبدالها بـ `justify-start` لتبدأ من أقصى اليمين.

### `src/pages/Trash.tsx` سطر 87
```typescript
// من:
<TabsList className="flex-wrap h-auto gap-1 flex-row-reverse justify-end">
// إلى:
<TabsList className="flex-wrap h-auto gap-1 flex-row-reverse justify-start">
```

| الملف | التغيير |
|-------|---------|
| `src/pages/Trash.tsx` | تغيير `justify-end` إلى `justify-start` |

