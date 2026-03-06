

## المشكلة

عند الدفع من رصيد المنح لشراء خدمة أو قبول عرض، هناك عدة مشاكل:

### 1. عدم إنشاء فاتورة (الخطأ الرئيسي)
في مسار الدفع الإلكتروني والتحويل البنكي، يتم إنشاء فاتورة تلقائياً عبر Edge Function أو عند موافقة الأدمن. لكن مسار **الدفع من المنح لا ينشئ فاتورة نهائياً** — لا في `Checkout.tsx` ولا في `BidPaymentDialog.tsx`.

### 2. عدم إنشاء عقد أو تحديث حالة المشروع (BidPaymentDialog)
عند قبول عرض والدفع من المنح:
- المشروع يبقى بحالة `open` بدلاً من `in_progress`
- لا يتم إنشاء عقد
- مقارنة بالدفع الإلكتروني الذي يتولى كل هذا عبر `processProjectPayment`

### 3. عدم إنشاء مشروع للخدمة (Checkout)
في مسار الدفع الإلكتروني، `moyasar-verify-payment` ينشئ مشروع تلقائي عند وجود جمعية مستفيدة. مسار المنح يتخطى هذا.

---

## التعديلات المطلوبة

### ملف `src/hooks/usePayFromGrants.ts`
إضافة إنشاء فاتورة بعد إنشاء الضمان (escrow):
- جلب نسبة العمولة من `commission_config`
- حساب مبلغ العمولة = amount × rate
- إدراج فاتورة في جدول `invoices` مع رقم فاتورة مولّد

### ملف `src/components/bids/BidPaymentDialog.tsx`
بعد دفع المنح وإنشاء الضمان:
- إنشاء عقد في جدول `contracts`
- تحديث حالة المشروع إلى `in_progress`
- (الفاتورة ستُنشأ تلقائياً من `usePayFromGrants` المعدّل)

### ملف `src/pages/Checkout.tsx`
- عند وجود جمعية مستفيدة (`selectedAssociation`): إنشاء مشروع تلقائي (كما يفعل `usePurchaseService`)
- تمرير `projectId` للـ escrow إن وُجد

### ملف `src/pages/PaymentSuccess.tsx`
- إضافة التعامل مع `method === "grant_balance"` لعرض رسالة نجاح مناسبة

### الملفات المعدلة
- `src/hooks/usePayFromGrants.ts` — إضافة إنشاء الفاتورة
- `src/components/bids/BidPaymentDialog.tsx` — إنشاء عقد + تحديث حالة المشروع
- `src/pages/Checkout.tsx` — إنشاء مشروع للجمعية المستفيدة
- `src/pages/PaymentSuccess.tsx` — دعم عرض نتيجة الدفع من المنح

