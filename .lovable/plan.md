

## خطة تأمين النظام المالي ضد الثغرات وسيناريوهات الخطأ

بعد مراجعة شاملة للنظام المالي عبر جميع المسارات (دفع إلكتروني، تحويل بنكي، منح، سحب، ضمان مالي)، وُجدت عدة ثغرات حرجة يجب معالجتها:

---

### الثغرات المكتشفة

| # | الثغرة | الخطورة | الوصف |
|---|--------|---------|-------|
| 1 | **عدم وجود UNIQUE constraint على `escrow_id` في `withdrawal_requests`** | حرجة | مزود الخدمة يمكنه إرسال طلبات سحب متعددة لنفس الضمان المالي (race condition عند الضغط السريع أو انقطاع النت) |
| 2 | **عدم وجود idempotency check في `processProjectPayment`** | حرجة | إذا استدعيت الـ edge function مرتين (retry بسبب timeout)، يتم إنشاء escrow مكرر + عقد مكرر + فاتورة مكررة |
| 3 | **عدم وجود idempotency check في `useCreateEscrow`** | متوسطة | الفحص الحالي يبحث عن أي escrow للمشروع لكن لا يفحص الحالة — escrow بحالة `failed` أو `refunded` يمنع إنشاء واحد جديد |
| 4 | **Client-side فقط لمنع السحب المكرر** | حرجة | `withdrawnEscrowIds` يتم حسابها في الـ UI فقط — لا يوجد constraint في DB يمنع الإدخال المكرر |
| 5 | **عدم وجود optimistic locking على تحديث escrow status** | عالية | Admin يمكنه release ثم release مرة أخرى لنفس الضمان (double release) |
| 6 | **`usePayFromGrants` بدون transaction** | عالية | إذا فشل إنشاء الـ escrow بعد خصم المنح، تضيع الأموال من رصيد المنح بدون إنشاء ضمان |
| 7 | **Client-side disable فقط لزرار الإتمام** | متوسطة | إذا ضُغط مرتين بسرعة، يتم release الـ escrow مرتين (الثاني سيفشل لكن قد ينشئ فاتورة مكررة) |
| 8 | **`handleApproveWithdrawal` بدون فحص حالة الطلب** | عالية | Admin يمكنه الموافقة على نفس طلب السحب مرتين إذا فتح التبويب من مكانين |

---

### التعديلات المطلوبة

#### 1. Database Migration — Constraints حرجة

```sql
-- منع السحب المكرر لنفس الضمان المالي
ALTER TABLE withdrawal_requests 
  ADD CONSTRAINT unique_escrow_withdrawal 
  UNIQUE (escrow_id) WHERE (status != 'rejected');

-- منع إنشاء escrow مكرر لنفس المشروع بحالة فعالة  
CREATE UNIQUE INDEX unique_active_project_escrow 
  ON escrow_transactions(project_id) 
  WHERE status IN ('held', 'released', 'pending_payment');
```

#### 2. Edge Function `moyasar-verify-payment` — Idempotency

في `processProjectPayment`: فحص وجود escrow فعال للمشروع قبل الإنشاء. إذا موجود، return بدون إنشاء مكرر.

#### 3. `useEscrow.ts` — إصلاح فحص الوجود

في `useCreateEscrow`: تعديل الفحص ليستثني الحالات الميتة (`failed`, `refunded`) فقط ويمنع الإنشاء إذا كان هناك escrow بحالة فعالة.

#### 4. `useWithdrawals.ts` — Server-side duplicate prevention

إضافة فحص قبل الإدخال: هل يوجد طلب سحب غير مرفوض لنفس الـ `escrow_id`؟

#### 5. `useAdminFinance` — Optimistic locking لتحديث الحالات

عند release/refund: إضافة `.eq("status", "held")` للتأكد من أن الحالة لم تتغير.  
عند الموافقة على السحب: إضافة `.eq("status", "pending")`.

#### 6. `usePayFromGrants.ts` — إعادة المنح عند الفشل

إضافة try/catch حول إنشاء الـ escrow، وفي حالة الفشل: إعادة حالة المنح المستهلكة إلى `available`.

#### 7. UI — منع الضغط المزدوج

إضافة `loading` state + تعطيل الأزرار أثناء المعالجة في:
- `handleComplete` (موجود جزئياً)
- `handleApproveWithdrawal`
- `handleEscrowWithReceipt`

#### 8. `useReleaseEscrow` — فحص الحالة قبل التحديث

إضافة `.eq("status", "held")` في الـ update بدلاً من الاعتماد على الفحص المنفصل (race condition بين select و update).

---

### ملخص الملفات المتأثرة

| الملف | التعديل |
|---|---|
| Migration SQL | UNIQUE constraint + partial index |
| `supabase/functions/moyasar-verify-payment/index.ts` | Idempotency check في processProjectPayment |
| `src/hooks/useEscrow.ts` | إصلاح فحص الوجود + optimistic lock في release |
| `src/hooks/useWithdrawals.ts` | Server-side duplicate check قبل insert |
| `src/hooks/usePayFromGrants.ts` | Rollback المنح عند فشل إنشاء escrow |
| `src/pages/admin/AdminFinance.tsx` | Optimistic locking + منع ضغط مزدوج |
| `src/pages/ProjectDetails.tsx` | Optimistic lock في release escrow |

