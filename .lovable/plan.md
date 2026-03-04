

## خطة تفصيلية: رحلة التحويل البنكي للجمعية (من الشراء حتى بدء المشروع)

### الرحلة المطلوبة

```text
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  1. الجمعية      │───▶│  2. الأدمن       │───▶│  3. فاتورة +     │───▶│  4. مزود الخدمة  │───▶│  5. بدء المشروع  │
│  تحويل بنكي +    │    │  يراجع ويوافق    │    │  عقد تلقائي      │    │  يوقع العقد      │    │  + إشعار الجمعية │
│  رفع إيصال       │    │  أو يرفض         │    │  + إشعار المزود   │    │                  │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

### الوضع الحالي vs المطلوب

| الخطوة | الوضع الحالي | المطلوب |
|--------|-------------|---------|
| موافقة الأدمن | يحدّث الضمان فقط | يحدّث الضمان + يُصدر فاتورة + يُنشئ عقد + يُشعر المزود |
| توقيع العقد | يُنشئ ضمان (تكرار) | لا يُنشئ ضمان (موجود أصلاً) + يبدأ المشروع تلقائياً |
| حالة المشروع | in_progress فوراً | pending_payment → in_progress بعد توقيع العقد |

---

### 1. تعديل قاعدة البيانات (Migration)

لا حاجة لأعمدة جديدة. التغييرات المطلوبة:

- **تعديل `useCreateBankTransfer`**: عند إنشاء المشروع من checkout الجمعية، يُنشأ بحالة `pending_payment` بدلاً من `in_progress`
- إضافة عمود `payment_method` لجدول `escrow_transactions` (اختياري — لتمييز التحويل البنكي عن الإلكتروني في السجلات)

### 2. تعديل `useApproveBankTransfer` (src/hooks/useBankTransfer.ts)

عند موافقة الأدمن على تحويل بنكي:

1. ✅ تحديث `bank_transfers.status` → `approved` (موجود)
2. ✅ تحديث `escrow_transactions.status` → `held` (موجود)
3. **جديد**: إصدار فاتورة تلقائية (`invoices` table) مرتبطة بالـ escrow وصادرة للجمعية (payer_id)
4. **جديد**: إنشاء عقد تلقائي (`contracts` table) يربط المشروع والجمعية والمزود
5. **جديد**: إرسال إشعار للمزود بوجود عقد يحتاج توقيعه
6. **جديد**: إرسال إشعار للجمعية بالموافقة + صدور الفاتورة

### 3. تعديل `useSignContract` (src/hooks/useContracts.ts)

عند توقيع المزود للعقد:

- **تغيير**: بدلاً من إنشاء escrow (الموجود أصلاً)، يتحقق إذا كان العقد مرتبطاً بضمان مالي محتجز → إذا نعم، يحدّث حالة المشروع إلى `in_progress`
- **جديد**: إرسال إشعار للجمعية: "وقّع مزود الخدمة على العقد وتم بدء المشروع"

### 4. تعديل صفحة Checkout (src/pages/Checkout.tsx)

- عند اختيار الجمعية "تحويل بنكي"، إنشاء المشروع بحالة `pending_payment` بدلاً من `in_progress`
- تحديث رسالة صفحة النجاح لتوضح المراحل القادمة (مراجعة → فاتورة → عقد → توقيع → بدء)

### 5. تعديل صفحة PaymentSuccess (src/pages/PaymentSuccess.tsx)

- إضافة **Timeline/Stepper** يوضح للجمعية مراحل الرحلة القادمة:
  1. ✅ تم إرسال الإيصال
  2. ⏳ بانتظار موافقة الإدارة
  3. 🔜 إصدار الفاتورة
  4. 🔜 إنشاء العقد وتوقيع المزود
  5. 🔜 بدء المشروع

### 6. تعديل صفحة العقود للمزود (src/pages/Contracts.tsx + ContractCard.tsx)

- إبراز العقود غير الموقعة بشكل واضح (بطاقة مميزة بلون أو حدود)
- إضافة شارة "مطلوب توقيعك" للعقود الجديدة
- عند توقيع المزود، عرض رسالة نجاح توضح أن المشروع سيبدأ

### 7. تحسين واجهة الأدمن (src/pages/admin/AdminFinance.tsx)

- في تبويب التحويلات البنكية، إضافة عمود يوضح اسم الخدمة/المشروع المرتبط
- عند الموافقة، عرض ملخص يوضح ما سيحدث تلقائياً (فاتورة + عقد)

---

### التفاصيل التقنية

#### Hook: `useApproveBankTransfer` — المنطق الجديد بعد الموافقة:

```text
1. UPDATE bank_transfers SET status='approved'
2. UPDATE escrow SET status='held'
3. جلب بيانات الضمان (payer_id, payee_id, project_id, amount, service_id)
4. INSERT INTO invoices (invoice_number, amount, commission_amount, issued_to, escrow_id)
5. INSERT INTO contracts (project_id, association_id, provider_id, terms)
6. INSERT INTO notifications → المزود: "عقد جديد يحتاج توقيعك"
7. INSERT INTO notifications → الجمعية: "تمت الموافقة + صدرت الفاتورة"
```

#### Hook: `useSignContract` — التعديل:

```text
بعد توقيع الطرفين:
  IF escrow موجود ومحتجز للمشروع:
    UPDATE projects SET status='in_progress'  ← بدلاً من إنشاء escrow جديد
  ELSE:
    السلوك الحالي (إنشاء escrow)  ← للعقود العادية بدون تحويل بنكي
```

### الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/hooks/useBankTransfer.ts` | تحديث `useApproveBankTransfer` + `useCreateBankTransfer` |
| `src/hooks/useContracts.ts` | تحديث `useSignContract` |
| `src/pages/Checkout.tsx` | حالة المشروع المبدئية |
| `src/pages/PaymentSuccess.tsx` | Timeline للمراحل |
| `src/pages/Contracts.tsx` | إبراز العقود المطلوب توقيعها |
| `src/components/contracts/ContractCard.tsx` | شارة "مطلوب توقيعك" |
| `src/pages/admin/AdminFinance.tsx` | عمود الخدمة + ملخص الموافقة |
| `src/hooks/useInvoices.ts` | استخدام `generateInvoiceNumber` في approval flow |

