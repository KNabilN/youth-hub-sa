

# مراجعة شاملة للموقع — المشكلات المكتشفة وخطة الإصلاح

## ملخص المراجعة
بعد فحص شامل للكود وقاعدة البيانات والـ Edge Functions، تم اكتشاف **5 مشكلات** تحتاج إصلاح:

---

## المشكلة 1: فاتورة الدفع الإلكتروني لا تحفظ `vat_amount` (خطيرة)

**الموقع**: `supabase/functions/moyasar-verify-payment/index.ts` — دالة `createInvoiceAndNotifyAdmin`

**الوصف**: عند الدفع الإلكتروني (Moyasar)، يتم حساب `vatAmount` لكن يُخزن فقط في حقل `notes` كنص، بينما لا يُملأ عمود `vat_amount` في جدول `invoices`. في المقابل، الدفع من المنح (`usePayFromGrants`) والدفع البنكي (`useInvoices`) يملآن العمود بشكل صحيح.

**النتيجة**: الفواتير المولدة من الدفع الإلكتروني تظهر بقيمة ضريبة = 0 في التقارير والـ PDF.

**الإصلاح**: إضافة `vat_amount: vatAmount` في insert الفاتورة بالـ Edge Function:
```typescript
// سطر 41-48: إضافة vat_amount
await adminClient.from("invoices").insert({
  invoice_number: generateInvoiceNumber(),
  amount: baseAmount,
  commission_amount: commissionAmount,
  vat_amount: vatAmount,  // ← مفقود حالياً
  issued_to: issuedTo,
  escrow_id: escrowId,
  notes: discountAmount > 0 ? `خصم: ${discountAmount} ر.س` : null,
});
```

---

## المشكلة 2: مسار الدفع الإلكتروني يرسل `commission` و `vat` خاطئين عند استخدام المنح الجزئي

**الموقع**: `src/pages/Checkout.tsx` — سطر 232-233

**الوصف**: عند الدفع المختلط (منح + إلكتروني)، يتم إرسال `pricing.commission` و `pricing.vat` الكاملين في `paymentContext` بدلاً من الحصة المتناسبة مع المبلغ المتبقي. هذا لا يؤثر على المبلغ المدفوع فعلياً (الذي يُحسب من `effectiveTotal`) لكن يؤدي لعدم تطابق البيانات في الفاتورة.

**الإصلاح**: حساب commission و vat بشكل نسبي عند الدفع المختلط:
```typescript
const ratio = effectiveTotal / totalAfterDiscount;
commission: Math.round(pricing.commission * ratio * 100) / 100,
vat: Math.round(pricing.vat * ratio * 100) / 100,
```

---

## المشكلة 3: تسجيل استخدام كود الخصم مكرر في مسار الدفع الإلكتروني

**الموقع**: `src/pages/Checkout.tsx` (سطر 194) + `src/pages/PaymentCallback.tsx` (سطر 78-86)

**الوصف**: عندما تغطي المنح جزءاً والباقي يُدفع إلكترونياً، يتم تسجيل استخدام الكود مرتين:
1. في `handleCheckout` عند مسار المنح (سطر 194) — لكن هذا يعمل فقط عند `grantCoversAll`
2. في `PaymentCallback` بعد التحقق من Moyasar (سطر 78-86) — يعمل دائماً

المسار العادي (إلكتروني بدون منح) يسجل مرة واحدة فقط (PaymentCallback) — هذا صحيح.
المسار البنكي يسجل في `handleCheckout` فقط — صحيح.
المسار المختلط (منح كاملة) يسجل في `handleCheckout` فقط ويرجع قبل الوصول لـ PaymentCallback — صحيح.

**النتيجة**: لا يوجد تكرار فعلي حالياً لأن المسارات منفصلة. لكن يجب إضافة حماية `unique` على مستوى قاعدة البيانات.

**الإصلاح**: إضافة constraint لمنع التكرار:
```sql
ALTER TABLE discount_code_usages 
ADD CONSTRAINT discount_code_usages_unique_per_user 
UNIQUE (code_id, user_id, created_at);
```

---

## المشكلة 4: `discount_code_usages` JOIN مع `profiles` قد يفشل في التحميل

**الموقع**: `src/hooks/useDiscountCodes.ts` — سطر 66

**الوصف**: الاستعلام يستخدم `profiles:user_id(full_name, organization_name)` وهو JOIN عبر FK. الـ FK موجود (`discount_code_usages_user_id_fkey → profiles`). لكن RLS على `profiles` قد تمنع الأدمن من رؤية بيانات المستخدمين الآخرين حسب السياسة المعمول بها. إذا كان الأدمن لديه `has_role` policy على profiles فهذا يعمل.

**الحالة**: تم التحقق — الأدمن لديه سياسة `ALL` على أغلب الجداول. هذه **ليست مشكلة فعلية** حالياً.

---

## المشكلة 5: عدم تمرير `discountAmount` من Checkout إلى `usePayFromGrants` عند المنح الكاملة

**الموقع**: `src/pages/Checkout.tsx` — سطر 165

**الوصف**: عندما تغطي المنح كامل المبلغ مع وجود كود خصم، يتم استدعاء `payFromGrants.mutateAsync` بدون تمرير `discountAmount`. هذا يعني أن الفاتورة ستُحسب بالعمولة والضريبة على المبلغ الأصلي بدلاً من المبلغ بعد الخصم.

**الإصلاح**: تمرير `discountAmount` للدالة:
```typescript
await payFromGrants.mutateAsync({
  amount: itemBase,
  totalAmount: itemPricing.total,
  payeeId: item.micro_services.provider_id,
  serviceId: item.micro_services.id,
  projectId,
  discountAmount: discountAmount,  // ← مفقود
});
```

نفس المشكلة في المسار المختلط (سطر 181).

---

## ملخص الإصلاحات

| # | الملف | التغيير | الأولوية |
|---|-------|---------|----------|
| 1 | `moyasar-verify-payment/index.ts` | إضافة `vat_amount` في insert الفاتورة | عالية |
| 2 | `Checkout.tsx` | حساب commission/vat نسبياً في الدفع المختلط | متوسطة |
| 3 | Migration | إضافة unique constraint على الاستخدام | منخفضة |
| 4 | `Checkout.tsx` | تمرير `discountAmount` لـ `usePayFromGrants` | عالية |

## ما تم التأكد من صحته
- ✓ RLS مفعّل على جميع الجداول
- ✓ صورة التصنيف كـ fallback في جميع الأماكن
- ✓ التوجيه والحماية (ProtectedRoute/AdminRoute) صحيح
- ✓ القائمة الجانبية متسقة لكل دور
- ✓ Idempotency في الدفع الإلكتروني
- ✓ منطق الخصم (base - discount → commission + VAT) صحيح في pricing.ts
- ✓ FK constraints على discount_code_usages
- ✓ Lazy loading وتحسين الأداء

