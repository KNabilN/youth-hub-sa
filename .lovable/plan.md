

# تغيير منطق حساب الخصم — الضريبة والعمولة على المبلغ الأصلي أولاً ثم خصم الكود

## المنطق الجديد

```text
مثال: خدمة 1000 ر.س + كود خصم 200 ر.س + عمولة 5%

الحالي:
  المبلغ الأساسي:    1000
  الخصم:            −200
  المبلغ بعد الخصم:   800
  العمولة (5%):       40    ← على 800
  ضريبة (15%):       120    ← على 800
  الإجمالي:          960

الجديد (المطلوب):
  المبلغ الأساسي:    1000
  العمولة (5%):       50    ← على 1000
  ضريبة (15%):       150    ← على 1000
  الإجمالي قبل الخصم: 1200
  الخصم:            −200
  الإجمالي النهائي:   1000
```

## التغييرات

### 1. `src/lib/pricing.ts` — `calculatePricingWithDiscount`
العمولة والضريبة تُحسب على المبلغ الأصلي (مثل `calculatePricing`). الخصم يُطرح من الإجمالي النهائي فقط:
```typescript
const commission = Math.round(baseAmount * commissionRate * 100) / 100;
const vat = Math.round(baseAmount * VAT_RATE * 100) / 100;
const totalBeforeDiscount = baseAmount + commission + vat;
const discount = Math.min(discountAmount, totalBeforeDiscount);
const total = Math.round((totalBeforeDiscount - discount) * 100) / 100;
```

### 2. `src/components/payment/PricingBreakdownDisplay.tsx`
تحديث العرض ليظهر: المبلغ الأساسي → العمولة → الضريبة → الخصم → الإجمالي (بدلاً من عرض "المبلغ بعد الخصم" قبل العمولة والضريبة).

### 3. `supabase/functions/moyasar-verify-payment/index.ts` — `createInvoiceAndNotifyAdmin`
العمولة والضريبة على `baseAmount` بدلاً من `discountedBase`:
```typescript
const commissionAmount = Math.round(baseAmount * commissionRate * 100) / 100;
const vatAmount = Math.round(baseAmount * VAT_RATE * 100) / 100;
```

### 4. `src/hooks/usePayFromGrants.ts` — حساب الفاتورة
نفس التغيير: العمولة والضريبة على `amount` الأصلي.

### 5. `src/hooks/useInvoices.ts` — `useGenerateInvoice`
نفس التغيير: العمولة والضريبة على `amount` الأصلي.

### 6. `src/pages/Checkout.tsx`
تعديل حساب `totalAfterDiscount` ليكون: `pricing.total - discountAmount` بدلاً من استخدام `calculatePricingWithDiscount` بمنطق مختلف.

| الملف | التغيير |
|-------|---------|
| `src/lib/pricing.ts` | العمولة والضريبة على الأصلي، الخصم من الإجمالي |
| `PricingBreakdownDisplay.tsx` | تحديث ترتيب العرض |
| `moyasar-verify-payment/index.ts` | العمولة والضريبة على الأصلي |
| `usePayFromGrants.ts` | العمولة والضريبة على الأصلي |
| `useInvoices.ts` | العمولة والضريبة على الأصلي |
| `Checkout.tsx` | تحديث حساب الإجمالي بعد الخصم |

