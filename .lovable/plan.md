

## نتائج المراجعة

بعد مراجعة شاملة لجميع الأجزاء المالية، وجدت أن حساب **رسوم المنصة** و**ضريبة القيمة المضافة** في معظم الأماكن **صحيح** ويتم من المبلغ الأساسي. لكن هناك **مشكلة واحدة رئيسية** في ملف توليد فواتير PDF.

### المشكلة المكتشفة

**ملف `src/lib/zatca-invoice.ts`** (سطر 109-112) — حساب الفاتورة PDF خاطئ:

```text
الحالي (خاطئ):
  netAmount = amount - commission        ← الصافي = المبلغ الأساسي - العمولة
  vatAmount = netAmount × 15%            ← الضريبة تُحسب من الصافي (خطأ!)
  totalWithVat = netAmount + vatAmount

المطلوب (صحيح):
  vatAmount = amount × 15%               ← الضريبة تُحسب من المبلغ الأساسي
  commission = amount × commissionRate%  ← رسوم المنصة من المبلغ الأساسي
  total = amount + commission + vatAmount
```

الفاتورة PDF حالياً تعرض الضريبة محسوبة من (المبلغ - العمولة) بدلاً من المبلغ الأساسي. كذلك هيكل الفاتورة يعرض "الصافي" كأساس للحساب وهذا غير متسق مع نموذج التسعير المعتمد.

### ملخص حالة بقية الملفات

| الملف | الحالة |
|---|---|
| `src/lib/pricing.ts` | صحيح — VAT = base × 15% |
| `moyasar-verify-payment` Edge Function | صحيح — VAT = base × 15% |
| `src/components/payment/PricingBreakdownDisplay.tsx` | صحيح |
| `src/components/bids/BidPaymentDialog.tsx` | صحيح — يستخدم `calculatePricing` |
| `src/components/donor/DonationPaymentStep.tsx` | صحيح — يستخدم `calculatePricing` |
| `src/pages/Checkout.tsx` | صحيح — يستخدم `calculatePricing` |
| `src/hooks/useBankTransfer.ts` | صحيح — يخزن المبلغ الأساسي في escrow |
| `src/hooks/useEscrow.ts` | صحيح |
| `src/hooks/useInvoices.ts` | صحيح — commission = amount × rate |
| **`src/lib/zatca-invoice.ts`** | **خاطئ** — VAT = (amount - commission) × 15% |

### التعديل المطلوب

**ملف واحد فقط: `src/lib/zatca-invoice.ts`**

تعديل حساب الفاتورة PDF ليتوافق مع نموذج التسعير:
- الضريبة = المبلغ الأساسي × 15%
- رسوم المنصة = المبلغ الأساسي × نسبة العمولة (تُعرض في الفاتورة)
- الإجمالي = المبلغ الأساسي + رسوم المنصة + الضريبة

تحديث جدول الفاتورة PDF ليعرض: المبلغ الأساسي، رسوم المنصة، الضريبة، الإجمالي — بدلاً من الهيكل الحالي (صافي، ضريبة على الصافي).

