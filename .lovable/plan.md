
# إضافة عداد الحروف مع الحد الأقصى لجميع حقول الإدخال النصية

## الفكرة
إضافة عداد يظهر عدد الحروف الحالية / الحد الأقصى أسفل كل حقل نصي (Input و Textarea) في جميع النماذج، مع تطبيق `maxLength` على عنصر HTML لمنع تجاوز الحد.

## الحل: مكون مساعد `CharCounter`

إنشاء مكون صغير قابل لإعادة الاستخدام يعرض عداد الحروف، ثم استخدامه في جميع النماذج.

## النماذج المتأثرة

| النموذج | الحقول | الحد الأقصى |
|---------|--------|-------------|
| ServiceForm | title, description, long_description | 200, 5000, 10000 |
| ProjectForm | title, description | 200, 5000 |
| TicketForm | subject, description | 200, 2000 |
| BidForm | cover_letter | 5000 |
| ContactForm | name, message | 100, 1000 |
| TicketReplyThread | message input | (يُضاف حد) |
| AdminDirectEditDialog | text/textarea fields | (حسب الحقل) |

## التفاصيل التقنية

### 1. مكون جديد: `src/components/ui/char-counter.tsx`
- يستقبل `current` (عدد الحروف الحالي) و `max` (الحد الأقصى)
- يعرض نص مثل: `15 / 200`
- يتحول للون الأحمر عند الاقتراب من الحد (أكثر من 90%)

### 2. تعديل كل نموذج
- إضافة خاصية `maxLength` على عناصر `Input` و `Textarea`
- إضافة مكون `CharCounter` أسفل كل حقل نصي يحتوي على حد أقصى
- العداد يظهر بين `FormControl` و `FormMessage`

### مثال على الشكل النهائي
```text
عنوان الخدمة
[أدخل عنوان الخدمة_____________]
                          15 / 200
```

### الملفات المتأثرة
- **جديد**: `src/components/ui/char-counter.tsx`
- **تعديل**: `src/components/services/ServiceForm.tsx`
- **تعديل**: `src/components/projects/ProjectForm.tsx`
- **تعديل**: `src/components/tickets/TicketForm.tsx`
- **تعديل**: `src/components/provider/BidForm.tsx`
- **تعديل**: `src/components/landing/ContactForm.tsx`
- **تعديل**: `src/components/tickets/TicketReplyThread.tsx`
