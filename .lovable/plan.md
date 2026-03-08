

## إنشاء طلب تلقائي عند شراء جمعية لخدمة مباشرة

### المشكلة
عندما تشتري جمعية خدمة من السوق مباشرة، لا يتم إنشاء طلب (مشروع) ولا عقد تلقائياً. يتم فقط إنشاء ضمان مالي. هذا يعني أن الجمعية ومزود الخدمة لا يملكان مساحة لتتبع التسليم والتواصل.

حالياً إنشاء المشروع يحدث فقط عندما يكون المشتري **مانح** ويختار جمعية مستفيدة.

### الحل
عند شراء جمعية لخدمة، يتم تلقائياً:
1. إنشاء طلب (project) بـ `association_id = المشتري` و `assigned_provider_id = مزود الخدمة`
2. إنشاء عقد (contract) بين الطرفين
3. تحويل حالة الطلب إلى `in_progress`
4. ربط الضمان المالي بالطلب

### الملفات المتأثرة

| # | الملف | التغيير |
|---|---|---|
| 1 | `supabase/functions/moyasar-verify-payment/index.ts` | تعديل `processCheckout`: التحقق من دور المشتري عبر `user_roles`. إذا كان `youth_association` وليس هناك `beneficiary_id`، يُنشأ المشروع والعقد تلقائياً بـ `association_id = userId` |
| 2 | `src/hooks/useBankTransfer.ts` | تعديل `useCreateBankTransfer`: نفس المنطق — إذا كان المشتري جمعية ولم يُحدد مستفيد، إنشاء مشروع وعقد تلقائياً |
| 3 | `src/pages/Checkout.tsx` | تعديل مسار `grant_balance`: إذا كان المشتري جمعية، إنشاء مشروع وعقد بدون الحاجة لاختيار مستفيد. إخفاء اختيار "الجمعية المستفيدة" للجمعيات (هي المستفيدة تلقائياً) |
| 4 | `src/hooks/usePurchaseService.ts` | تعديل: إذا لم يكن هناك `beneficiaryId` لكن المشتري جمعية، إنشاء المشروع بـ `association_id = buyerId` |

### منطق التنفيذ الموحد (لكل مسار دفع)
```text
if (buyer is youth_association AND no beneficiary selected):
  → create project(association_id=buyer, provider=service_provider, status=in_progress)
  → create contract(project, association=buyer, provider, association_signed_at=now)
  → link escrow to project
  → notify provider
elif (buyer is donor AND beneficiary selected):
  → existing flow (create project for beneficiary)
```

### ملاحظات أمنية
- التحقق من الدور يتم في الـ Edge Function عبر `user_roles` بـ service role key
- RLS policies الحالية تسمح للجمعيات بإنشاء مشاريع خاصة بهم (`association_id = auth.uid()`)
- لا حاجة لتعديل سياسات الأمان

