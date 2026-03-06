

## الخطة

### المطلوب
1. طلب السحب يكون مرتبط بمعاملة ضمان محددة (مشروع معين) وليس مبلغ عشوائي
2. زر "طلب سحب" يظهر في كل صف معاملة بحالة `released` (صُرف) بدلاً من زر عام
3. إزالة التبويبات (Tabs) من سجل المعاملات - الشارة (Badge) في كل صف كافية
4. الأدمن يرى تفاصيل المشروع المرتبط بطلب السحب

### التعديلات

#### 1. إضافة عمود `escrow_id` لجدول `withdrawal_requests` (Migration)
```sql
ALTER TABLE withdrawal_requests ADD COLUMN escrow_id uuid REFERENCES escrow_transactions(id);
```
هذا يربط كل طلب سحب بمعاملة ضمان محددة.

#### 2. تعديل `src/components/provider/EarningsSummary.tsx`
- إزالة التبويبات (Tabs) بالكامل
- عرض جميع المعاملات بدون فلترة
- إضافة زر "طلب سحب" في كل صف بحالة `released` فقط (بشرط عدم وجود طلب سحب سابق لنفس المعاملة)
- إضافة callback prop `onWithdraw(escrowId, amount, projectTitle)` يُستدعى عند الضغط على الزر

#### 3. تعديل `src/pages/Earnings.tsx`
- إزالة حوار السحب بالمبلغ اليدوي (Dialog مع Input)
- إزالة زر "طلب سحب" العام من الهيدر
- إضافة حوار تأكيد بسيط يظهر اسم المشروع والمبلغ عند الضغط على "طلب سحب" في صف المعاملة
- تحديث `useCreateWithdrawal` لإرسال `escrow_id` مع المبلغ

#### 4. تعديل `src/hooks/useWithdrawals.ts`
- `useCreateWithdrawal`: يقبل `{ amount, escrow_id }` بدلاً من `amount` فقط
- `useWithdrawals`: يجلب `escrow_id` مع البيانات
- `useAllWithdrawals`: يجلب بيانات المشروع المرتبط عبر `escrow_transactions` → `projects`

#### 5. تعديل `src/components/admin/WithdrawalEscrowDetails.tsx` (أو عرض الأدمن)
- عرض تفاصيل المشروع المرتبط مباشرة في صف طلب السحب بدلاً من عرض كل معاملات المزود

### ملخص الملفات المتأثرة
| الملف | التعديل |
|---|---|
| Migration | إضافة `escrow_id` لـ `withdrawal_requests` |
| `src/hooks/useWithdrawals.ts` | تمرير `escrow_id`، جلب بيانات المشروع للأدمن |
| `src/components/provider/EarningsSummary.tsx` | إزالة Tabs، إضافة زر سحب لكل صف `released` |
| `src/pages/Earnings.tsx` | حوار تأكيد بدل إدخال مبلغ يدوي، إزالة زر السحب العام |

