

## مراجعة شاملة للموقع — النتائج والخطة

بعد مراجعة مفصلة لجميع الملفات الرئيسية في النظام، إليك الملاحظات مصنفة حسب الأولوية:

---

### 1. ثغرات أمنية ومالية (حرجة)

| # | المشكلة | الملف | الوصف |
|---|---------|-------|-------|
| 1 | **`useUpdateEscrowStatus` بدون optimistic locking** | `src/hooks/useAdminFinance.ts:24-31` | الـ `handleEscrowStatus` (تجميد، إعادة احتجاز، مراجعة) لا يتحقق من الحالة الحالية قبل التحديث. الأدمن يمكنه تجميد escrow محرر بالفعل. يجب إضافة `.eq("status", currentStatus)` |
| 2 | **`useApproveBankTransfer` بدون فحص حالة التحويل** | `src/hooks/useBankTransfer.ts:140-148` | لا يتحقق أن `status = 'pending'` قبل الموافقة. إذا فتح أدمنان نفس الصفحة يمكن الموافقة مرتين |
| 3 | **`useRejectBankTransfer` بدون فحص حالة** | `src/hooks/useBankTransfer.ts:296-321` | نفس المشكلة — لا يوجد `.eq("status", "pending")` |
| 4 | **Grant payment يكرر `assigned_provider_id` update** | `src/components/bids/BidPaymentDialog.tsx:162-164` | بعد `acceptBid` (التي تحدث `assigned_provider_id` و `budget`)، يقوم `handleGrantPayment` بتحديث المشروع مرة أخرى مع `assigned_provider_id` + `status`. هذا يعمل لكنه redundant ويمكن أن يسبب race condition |

### 2. مشاكل في الاتساق (عالية)

| # | المشكلة | الملف | الوصف |
|---|---------|-------|-------|
| 5 | **Mixed payment: escrow مكرر محتمل** | `BidPaymentDialog.tsx:176-240` | عند الدفع المختلط، يتم إنشاء escrow من `payFromGrants` ثم إذا اختار المستخدم دفع إلكتروني، يتم إنشاء escrow ثاني من `moyasar-verify-payment` (processProjectPayment). الـ unique index يمنع ذلك لكن سيسبب خطأ للمستخدم |
| 6 | **Bank transfer في BidPaymentDialog لا يحدث status to in_progress** | `BidPaymentDialog.tsx:120-141` | عند التحويل البنكي، لا يتم تغيير حالة المشروع لـ `in_progress` ولا إنشاء عقد — يتم ذلك فقط عند موافقة الأدمن. لكن `handleGrantPayment` ينشئ العقد ويحدث الحالة فوراً. هذا سلوك مقصود لكن يجب التأكد من أن `useApproveBankTransfer` يحدث status المشروع لـ `in_progress` |

### 3. مشاكل UI/UX (متوسطة)

| # | المشكلة | الملف | الوصف |
|---|---------|-------|-------|
| 7 | **Console warning: CustomChartTooltip forwardRef** | `AdminOverview.tsx:183` | Component يُمرر كـ ref بدون `forwardRef`. ليس خطأ وظيفي لكنه يسبب warning مستمر |
| 8 | **Earnings يعرض جميع الضمانات بما فيها `held`** | `useEarnings.ts` | الاستعلام يجلب جميع الضمانات للمزود بدون فلترة. المستخدم يرى ضمانات `held` (محتجزة) مع زر سحب معطل وهذا واضح، لكن الأفضل توضيح أن المحتجزة "قيد التنفيذ" |

### 4. تعديلات مطلوبة

#### التعديل 1: إضافة optimistic locking لـ `useUpdateEscrowStatus`
**الملف:** `src/hooks/useAdminFinance.ts`
```typescript
// إضافة expectedStatus كمعامل وتضمينه في الاستعلام
mutationFn: async ({ id, status, receipt_url, expectedStatus }) => {
  const query = supabase.from("escrow_transactions").update(update).eq("id", id);
  if (expectedStatus) query.eq("status", expectedStatus);
  const { data, error } = await query.select("id");
  if (!data?.length) throw new Error("تم تعديل الحالة مسبقاً");
}
```
ثم تحديث `handleEscrowStatus` في `AdminFinance.tsx` لتمرير `expectedStatus` بناءً على الحالة الحالية.

#### التعديل 2: إضافة optimistic locking لـ Bank Transfer approval/rejection
**الملف:** `src/hooks/useBankTransfer.ts`
- إضافة `.eq("status", "pending")` في `useApproveBankTransfer` و `useRejectBankTransfer`
- إضافة `.select("id")` وفحص عدم وجود نتيجة = تمت المعالجة مسبقاً

#### التعديل 3: إصلاح CustomChartTooltip forwardRef
**الملف:** `src/components/admin/AdminOverview.tsx`
- لف الـ component بـ `React.forwardRef`

#### التعديل 4: إضافة project status update عند الموافقة على bank transfer
**الملف:** `src/hooks/useBankTransfer.ts` — `useApproveBankTransfer`
- بعد إنشاء العقد (عند وجود `project_id`)، يجب تحديث حالة المشروع إلى `in_progress`:
```typescript
await supabase.from("projects").update({ status: "in_progress" }).eq("id", escrow.project_id);
```
*ملاحظة: هذا موجود بالفعل ضمنياً في بعض المسارات لكن يجب التأكد من تغطيته في جميع الحالات.*

---

### ملخص الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `src/hooks/useAdminFinance.ts` | Optimistic locking لـ `useUpdateEscrowStatus` |
| `src/hooks/useBankTransfer.ts` | Optimistic locking + project status update |
| `src/pages/admin/AdminFinance.tsx` | تمرير `expectedStatus` مع كل إجراء |
| `src/components/admin/AdminOverview.tsx` | إصلاح forwardRef warning |

### ما هو سليم بالفعل ✓
- RLS policies شاملة ومحكمة على جميع الجداول
- Unique indexes تمنع تكرار الضمانات والسحب
- Optimistic locking موجود في `useEscrow.ts`, `useWithdrawals.ts`
- Rollback المنح عند فشل إنشاء الضمان
- Idempotency في edge function
- ProtectedRoute يتحقق من التعليق
- AdminRoute يتحقق من الدور server-side
- DB triggers تدير الإشعارات بشكل موثوق

