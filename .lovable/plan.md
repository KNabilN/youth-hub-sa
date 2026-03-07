

## خطة: تصحيح المبالغ المالية في كل الجداول والفواتير

### المشكلة الجوهرية
1. **استهلاك المنح**: `payFromGrants` يمرر `bid.price` (المبلغ الأساسي فقط) بدل `pricing.total` (الأساسي + عمولة + ضريبة)
2. **الفواتير بدون ضريبة**: جدول `invoices` لا يحتوي عمود `vat_amount`، والإجمالي المعروض = أساسي + عمولة فقط (بدون VAT 15%)
3. **المشكلة منتشرة في**: صفحة الفواتير للمستخدم، لوحة الأدمن المالية، PDF الفاتورة، ملخص الأدمن المالي، تصدير CSV

### الأماكن المتأثرة بالتفصيل

| الملف | المشكلة |
|---|---|
| `usePayFromGrants.ts` | يستهلك المنح بـ `amount` ويحفظه في الضمان — المفروض الضمان = الأساسي، الاستهلاك = الإجمالي |
| `BidPaymentDialog.tsx` (سطر 157) | يمرر `bid.price` بدل `pricing.total` |
| `Checkout.tsx` (سطر 156) | يمرر `item.price * qty` بدل الإجمالي |
| `Invoices.tsx` (سطر 185) | الإجمالي = `amount + commission` بدون ضريبة |
| `AdminFinance.tsx` (سطر 480) | نفس المشكلة في جدول فواتير الأدمن |
| `AdminFinance.tsx` (سطر 175) | عند إصدار فاتورة من الأدمن لا يحسب الضريبة |
| `zatca-invoice.ts` (سطر 87, 174) | PDF: الإجمالي = أساسي + عمولة بدون ضريبة |
| `useInvoices.ts` | `generateInvoice` لا يحفظ الضريبة |
| `FinanceSummary.tsx` | لا يعرض إجمالي الضرائب المحصّلة |
| CSV exports | عمود "الإجمالي" محسوب غلط |

### التعديلات المطلوبة

#### 1. Migration: إضافة `vat_amount` لجدول `invoices`
```sql
ALTER TABLE invoices ADD COLUMN vat_amount numeric NOT NULL DEFAULT 0;
```

#### 2. `usePayFromGrants.ts` — تعديل Interface + المنطق
- إضافة `totalAmount` (إجمالي ما يُخصم من المنح) و`baseAmount` (مبلغ الضمان للمزود)
- استهلاك المنح بـ `totalAmount`
- إنشاء الضمان بـ `baseAmount`
- حساب وحفظ `vat_amount` في الفاتورة

#### 3. `BidPaymentDialog.tsx` — تمرير المبالغ الصحيحة
- `handleGrantPayment`: تمرير `amount: bid.price, totalAmount: pricing.total`
- `handleMixedPayment`: تمرير `amount: grantPortionBase, totalAmount: grantPortionForMixed`

#### 4. `Checkout.tsx` — تمرير المبالغ الصحيحة
- حساب الإجمالي لكل عنصر وتمريره

#### 5. `useInvoices.ts` — إضافة حساب الضريبة
- حساب `vat_amount = amount * 0.15` وحفظها

#### 6. `Invoices.tsx` — إضافة عمود الضريبة + تصحيح الإجمالي
- إضافة عمود "الضريبة" بين العمولة والإجمالي
- الإجمالي = `amount + commission + vat`

#### 7. `AdminFinance.tsx` — نفس التعديلات
- إضافة عمود الضريبة في جدول الفواتير
- تصحيح الإجمالي
- عند إصدار الفاتورة من release/refund: حساب وحفظ `vat_amount`
- تصحيح أعمدة تصدير CSV

#### 8. `zatca-invoice.ts` — إضافة سطر الضريبة في PDF
- إضافة عمود "ضريبة القيمة المضافة (15%)" في جدول البنود
- تصحيح الإجمالي ليشمل الضريبة

#### 9. `FinanceSummary.tsx` — إضافة بطاقة إيرادات الضريبة
- إضافة بطاقة "إيرادات الضريبة" من مجموع `vat_amount` في الفواتير

### الملفات المتأثرة

| الملف | التعديل |
|---|---|
| DB Migration | إضافة `vat_amount` |
| `src/hooks/usePayFromGrants.ts` | interface + منطق الاستهلاك والضمان |
| `src/hooks/useInvoices.ts` | حساب وحفظ الضريبة |
| `src/components/bids/BidPaymentDialog.tsx` | تمرير `totalAmount` |
| `src/pages/Checkout.tsx` | تمرير `totalAmount` |
| `src/pages/Invoices.tsx` | عمود ضريبة + إجمالي صحيح |
| `src/pages/admin/AdminFinance.tsx` | عمود ضريبة + إجمالي + إصدار فاتورة + CSV |
| `src/lib/zatca-invoice.ts` | سطر ضريبة في PDF |
| `src/components/admin/FinanceSummary.tsx` | بطاقة إيرادات الضريبة |

