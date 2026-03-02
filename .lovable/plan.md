
# تحسين بطاقات المميزات بتأثيرات ديناميكية وحجم أكبر

## التغييرات المطلوبة

### 1. تحسين تأثير card-hover في `src/index.css`
- إضافة تأثير scale خفيف عند التمرير
- زيادة ارتفاع الظل (shadow) عند hover
- إضافة transition سلس للحدود

### 2. تعديل بطاقات المميزات في `src/pages/Index.tsx` (السطور 83-97)
- زيادة الحشو (padding) من `p-6` إلى `p-8`
- توسيط الأيقونة والعنوان والوصف (مثل الصورة المرجعية)
- تكبير حجم الأيقونة من `w-14 h-14` إلى `w-16 h-16`
- إضافة `rounded-2xl` مع خلفية بيضاء نظيفة بدلا من التدرج
- إضافة حد خفيف يتغير لونه عند hover
- زيادة المسافة الداخلية `min-h-[220px]` لجعل البطاقات أطول

### 3. تحسين بطاقات آراء العملاء في `src/components/landing/Testimonials.tsx`
- توسيط المحتوى داخل البطاقة
- تكبير الحشو الداخلي

### التفاصيل التقنية

**index.css** - تحديث `.card-hover`:
```css
.card-hover {
  @apply transition-all duration-300 ease-out;
}
.card-hover:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 30px -5px hsl(var(--foreground) / 0.1), 0 6px 15px -4px hsl(var(--foreground) / 0.06);
  border-color: hsl(var(--primary) / 0.3);
}
```

**Index.tsx** - بطاقات المميزات:
- تغيير الخلفية من gradient إلى `bg-card` (أبيض نظيف)
- توسيط المحتوى: `text-center items-center`
- زيادة `p-8 min-h-[240px]`
- الأيقونة بمركز البطاقة أعلاها

**Testimonials.tsx** - بطاقات الآراء:
- توسيط الأيقونة (Quote) والنص
- زيادة padding إلى `p-8`
