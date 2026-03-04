

## مراجعة شاملة للمنصة — مشاكل مكتشفة وخطة الإصلاح

### 1. مشاكل في تدفق البيانات (Database Connectivity)

| المشكلة | الملف | التفاصيل |
|---------|-------|----------|
| **طلبات المنح لا تُعبأ تلقائياً في صفحة المنح** | `Donations.tsx` | عند ضغط المانح "تبرع" من `/grant-requests` أو `/my-grant-requests`، يتم تمرير `grant_request_id` و`association_id` و`amount` عبر URL params، لكن `Donations.tsx` لا يقرأ هذه الـ params إطلاقاً — لا يوجد `useSearchParams`. الفورم يبدأ فارغاً دائماً |
| **grant_request لا يتحدث بشكل دقيق عند الموافقة** | `useBankTransfer.ts` (L186-194) | المطابقة تتم بـ `amount` + `association_id` + `status=pending` — مما قد يطابق grant_request خاطئ إذا كان هناك طلبان بنفس المبلغ. يجب الربط عبر `grant_request_id` محدد بدلاً من المطابقة بالمبلغ |
| **عدم وجود عمود `grant_request_id` في `escrow_transactions`** | Schema | لا يوجد ربط مباشر بين الـ escrow وطلب المنحة، مما يمنع التتبع الدقيق |

### 2. مشاكل في UI/UX

| المشكلة | الملف | التفاصيل |
|---------|-------|----------|
| **DonationForm: مبلغ افتراضي = 0** | `DonationForm.tsx` (L49) | `defaultValues: { amount: 0 }` — يظهر "0" في الحقل بدلاً من placeholder فارغ |
| **عدم وجود header موحد في صفحات GrantRequests و MyGrantRequests** | `GrantRequests.tsx`, `MyGrantRequests.tsx` | تستخدم h1 + p بدون الأيقونة المحاطة بخلفية ولا الخط المتدرج (gradient divider) المستخدم في باقي الصفحات مثل Contracts و Donations |
| **عدم وجود header موحد في Donors** | `Donors.tsx` | نفس المشكلة — لا يتبع نمط "Unified Header" المعتمد |
| **MyGrants: حالة "funded" تظهر بلون outline غير واضح** | `MyGrants.tsx` (L25) | `funded` يستخدم `variant: "outline"` — لا يميزها بصرياً كحالة إيجابية. يجب أن تكون `default` (لون أخضر/أساسي) |
| **DonationTimeline: الخط الرأسي على الجانب الخاطئ** | `DonationTimeline.tsx` (L38) | `end-4` يضع الخط في اليسار في RTL — يجب أن يكون `start-4` ليتوافق مع اتجاه الأيقونات |

### 3. مشاكل وظيفية (Functional Issues)

| المشكلة | الملف | التفاصيل |
|---------|-------|----------|
| **useCreateBankTransfer يُنشئ bank_transfer لكل escrow بنفس المبلغ الإجمالي** | `useBankTransfer.ts` (L76-87) | إذا كانت السلة تحتوي 3 خدمات، يتم إنشاء 3 bank_transfers كل منها بـ `amount: total` (المبلغ الإجمالي) بدلاً من مبلغ كل خدمة |
| **عدم وجود pagination في صفحات GrantRequests و Donors** | عدة صفحات | مع كثرة البيانات، لا يوجد pagination أو infinite scroll |
| **Checkout: اختيار الجمعية بدون بحث** | `Checkout.tsx` (L197-208) | يستخدم Select عادي بدون بحث — نفس المشكلة التي حُلّت في DonationForm |
| **useSignContract: لا يتحقق من وجود assigned_provider_id** | `useContracts.ts` (L75-80) | عند بدء المشروع تلقائياً، لا يتحقق أن المشروع فيه مزود معين |

### 4. مشاكل في سلاسة التدفق (Flow Gaps)

| المشكلة | التفاصيل |
|---------|----------|
| **لا يوجد ربط بين التبرع وطلب المنحة** | عندما يتبرع المانح من صفحة طلبات الدعم، لا يتم حفظ `grant_request_id` في أي مكان (لا escrow ولا donor_contribution)، فلا يمكن تتبع أن هذا التبرع جاء استجابة لطلب معين |
| **عدم وجود إدارة طلبات المنح في لوحة الأدمن** | لا توجد صفحة للأدمن لمراجعة/موافقة/رفض طلبات المنح (`grant_requests`) |
| **DonationForm لا يدعم التعبئة من URL** | عند الانتقال من "طلبات الدعم" بالـ params، لا يتم ملء الفورم تلقائياً |

---

### خطة الإصلاح

#### 1. إضافة `grant_request_id` لجدول `escrow_transactions` (Migration)
- عمود جديد `grant_request_id uuid DEFAULT NULL` للربط المباشر

#### 2. إصلاح تعبئة الفورم من URL في `Donations.tsx`
- إضافة `useSearchParams` لقراءة `association_id`, `amount`, `project_id` من URL
- تمرير القيم كـ `defaultValues` لـ `DonationForm`
- حفظ `grant_request_id` في escrow و donor_contribution

#### 3. إصلاح `useCreateBankTransfer` — مبلغ bank_transfer
- استبدال `amount` (الإجمالي) بـ `item.price` لكل bank_transfer

#### 4. إصلاح `useApproveBankTransfer` — مطابقة grant_request
- استخدام `grant_request_id` من escrow بدلاً من المطابقة بالمبلغ

#### 5. توحيد UI
- تطبيق نمط "Unified Header" (أيقونة + gradient divider) على: `GrantRequests`, `MyGrantRequests`, `Donors`, `MyGrants`
- إصلاح DonationForm: `amount` default → `undefined` مع placeholder
- إصلاح DonationTimeline: `end-4` → `start-4`
- تحسين funded badge color

#### 6. إضافة Combobox للـ Checkout
- تحويل حقل اختيار الجمعية في Checkout إلى combobox قابل للبحث

#### 7. إضافة صفحة إدارة طلبات المنح في الأدمن (اختياري — يمكن تأجيله)

### الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| Migration | إضافة `grant_request_id` لـ `escrow_transactions` |
| `src/pages/Donations.tsx` | قراءة URL params + تمريرها للفورم |
| `src/components/donor/DonationForm.tsx` | دعم `defaultValues` prop + إصلاح amount |
| `src/hooks/useBankTransfer.ts` | إصلاح bank_transfer amount + grant_request matching |
| `src/pages/GrantRequests.tsx` | Unified Header |
| `src/pages/MyGrantRequests.tsx` | Unified Header |
| `src/pages/Donors.tsx` | Unified Header |
| `src/pages/MyGrants.tsx` | Unified Header + funded badge |
| `src/components/donor/DonationTimeline.tsx` | RTL fix |
| `src/pages/Checkout.tsx` | Combobox للجمعية |

