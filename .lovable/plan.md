

# تعديل حسابات الخصم — الخصم من المبلغ الأساسي أولاً

## المنطق الجديد (حسب طلب العميل)

```text
مثال: خدمة 1000 ر.س + كود خصم 200 ر.س + عمولة 5%

الحالي (خاطئ):
  المبلغ الأساسي:    1000
  العمولة (5%):       50    ← على 1000
  ضريبة (15%):       150    ← على 1000
  الإجمالي:          1200
  بعد الخصم:         1000   (1200 - 200)

الجديد (صحيح):
  المبلغ الأساسي:    1000
  الخصم:            -200
  المبلغ بعد الخصم:   800
  العمولة (5%):       40    ← على 800 (تتأثر بالخصم)
  ضريبة (15%):       120    ← على 800 (لا تدخل في الخصم، تُحسب بعده)
  الإجمالي:           960
  المزود يحصل على:   1000   ← كامل المبلغ الأصلي (المنصة تتحمل الفرق)
```

## التغييرات

### 1. `src/lib/pricing.ts`
إضافة دالة `calculatePricingWithDiscount(baseAmount, commissionRate, discountAmount)`:
- `discountedBase = max(baseAmount - discountAmount, 0)`
- `commission = discountedBase * commissionRate`
- `vat = discountedBase * VAT_RATE`
- `total = discountedBase + commission + vat`
- تُرجع كائن يحتوي على `originalSubtotal` (للمزود) + `discountedSubtotal` + `discount` + `commission` + `vat` + `total`

### 2. `src/components/payment/PricingBreakdownDisplay.tsx`
- إضافة prop اختياري `discountAmount` و `originalSubtotal`
- عرض سطر الخصم بين المبلغ الأساسي والعمولة
- العمولة والضريبة تُحسب على المبلغ بعد الخصم
- إضافة ملاحظة صغيرة "مستحقات المزود: X ر.س" إذا كان هناك خصم

### 3. `src/pages/Checkout.tsx`
- استخدام `calculatePricingWithDiscount` بدلاً من الحساب اليدوي الحالي
- إزالة متغير `discountDeduction` الحالي واستبداله بالحساب الجديد
- تمرير القيم الصحيحة لـ Moyasar والتحويل البنكي والمنح
- تحديث `paymentContext` ليحتوي على المبالغ الجديدة (discounted commission, discounted vat)

### 4. `supabase/functions/moyasar-verify-payment/index.ts`
- قراءة `discount_amount` من context
- حساب `discountedBase = item.price - discountPortion` لكل item
- الفاتورة تُنشأ بالعمولة والضريبة المحسوبة على المبلغ بعد الخصم
- الضمان المالي (escrow) يبقى بالمبلغ الأصلي `item.price` (حق المزود كامل)

### 5. `src/hooks/usePayFromGrants.ts`
- نفس المنطق: الفاتورة بالعمولة والضريبة على المبلغ بعد الخصم

### 6. `src/hooks/useInvoices.ts`
- إضافة param اختياري `discountAmount` لحساب العمولة والضريبة بشكل صحيح

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/lib/pricing.ts` | إضافة `calculatePricingWithDiscount` |
| `src/components/payment/PricingBreakdownDisplay.tsx` | عرض الخصم والقيم المعدلة |
| `src/pages/Checkout.tsx` | استخدام الحساب الجديد في كل مسارات الدفع |
| `supabase/functions/moyasar-verify-payment/index.ts` | فواتير بالمبالغ الصحيحة |
| `src/hooks/usePayFromGrants.ts` | فواتير بالمبالغ الصحيحة |
| `src/hooks/useInvoices.ts` | دعم الخصم في حساب الفاتورة |

