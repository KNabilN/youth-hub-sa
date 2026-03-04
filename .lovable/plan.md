

# تغيير لوحة الألوان للصفحة الرئيسية إلى الأزرق

## المشكلة
الصفحة الرئيسية تستخدم اللون الأخضر/التيل الحالي (primary) في كل مكوناتها. المطلوب تحويلها للأزرق ودرجاته.

## النهج
إضافة CSS class يُعيد تعريف متغيرات `--primary` و `--accent` و `--ring` بدرجات الأزرق، ثم تطبيقه على `PublicLayout` فقط — بحيث لا يتأثر الداشبورد أو باقي الصفحات الداخلية.

## التغييرات

### 1. `src/index.css` — إضافة class جديد
```css
.landing-blue-theme {
  --primary: 210 70% 45%;        /* أزرق متوسط */
  --primary-foreground: 0 0% 100%;
  --accent: 200 60% 50%;         /* أزرق فاتح */
  --accent-foreground: 0 0% 100%;
  --ring: 210 70% 45%;
}
```

### 2. `src/components/landing/PublicLayout.tsx`
تطبيق الـ class على الـ wrapper div:
```tsx
<div className="min-h-screen bg-background landing-blue-theme">
```

### 3. `src/pages/Index.tsx`
- تغيير overlay الـ Hero من `bg-[hsl(var(--primary))]/75` (يصبح أزرق تلقائياً)
- تغيير CTA من `bg-[#2381C0]` إلى `bg-[hsl(var(--primary))]` ليتماشى مع الثيم الموحد

### 4. `src/index.css` — تحديث `gradient-text`
الـ gradient-text يستخدم `--primary` و `--accent` فسيتحول تلقائياً للأزرق داخل الصفحة الرئيسية.

## النتيجة
- الصفحة الرئيسية: أزرق بالكامل (Hero، أزرار، بادجات، إحصائيات، كروت)
- الداشبورد والصفحات الداخلية: تبقى بالأخضر/التيل كما هي
- الفوتر يبقى بلونه الداكن الحالي

