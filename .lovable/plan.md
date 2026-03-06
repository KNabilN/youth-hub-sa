

## المشكلة

نموذج التسعير في المنصة يضيف العمولة **فوق** المبلغ الأساسي (Add-on model). يعني:
- المبلغ الأساسي (ما يحصل عليه المزود) = 500,000
- العمولة = 500,000 × 10% = 50,000 (يدفعها الدافع فوق المبلغ)
- **الصافي للمزود = 500,000** (وليس 450,000)

لكن الكود الحالي يحسب "الصافي" كـ `amount - commission` في عدة أماكن، وكأن العمولة تُخصم من المبلغ الأساسي. هذا خطأ.

## الأماكن المتأثرة (5 مواقع)

### 1. صفحة الفواتير — `src/pages/Invoices.tsx` (سطر 148)
```
الحالي: (Number(inv.amount) - Number(inv.commission_amount)).toLocaleString()
المطلوب: Number(inv.amount).toLocaleString()
```
وتغيير عنوان العمود من "الصافي" إلى "الإجمالي" وحسابه = `amount + commission`

### 2. صفحة الأدمن المالية — `src/pages/admin/AdminFinance.tsx` (سطر 467)
نفس المشكلة — "الصافي" يُحسب كـ `amount - commission`

### 3. تصدير CSV للفواتير — `src/pages/admin/AdminFinance.tsx` (سطر 866)
```
net: (inv) => String(Number(inv.amount) - Number(inv.commission_amount))
```

### 4. `useReleaseEscrow` — `src/hooks/useEscrow.ts` (سطر 67)
```
netAmount = Number(escrow.amount) - commissionAmount
```
هذا يُرجع الصافي للمزود بعد خصم العمولة، لكن في نموذج Add-on المزود يحصل على كامل المبلغ.

### 5. عناوين أعمدة التصدير — `src/pages/admin/AdminFinance.tsx` (سطر 28)
تغيير تسمية "الصافي" إلى "الإجمالي"

## التعديلات

### `src/pages/Invoices.tsx`
- تغيير عنوان العمود "الصافي" → "الإجمالي"
- الحساب: `amount + commission` بدل `amount - commission`

### `src/pages/admin/AdminFinance.tsx`
- نفس التغيير في جدول الفواتير (عنوان + حساب)
- تصدير CSV: `net` → `amount + commission`
- تسمية عمود التصدير

### `src/hooks/useEscrow.ts`
- `netAmount = escrow.amount` (المزود يحصل على كامل المبلغ)

### الملفات
- `src/pages/Invoices.tsx`
- `src/pages/admin/AdminFinance.tsx`
- `src/hooks/useEscrow.ts`

