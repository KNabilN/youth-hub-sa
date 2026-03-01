
# مراجعة وإصلاح الربط بين قاعدة البيانات والأدوار المختلفة

## المشاكل المكتشفة

### 1. صفحة الشكاوى (MyDisputes) - الجمعيات لا ترى شكاوى مشاريعها
**المشكلة:** hook `useMyDisputes` يفلتر النتائج بناءً على `raised_by === user.id || projects.assigned_provider_id === user.id` فقط. هذا يعني أن الجمعية لا ترى الشكاوى المرفوعة من مقدم الخدمة على مشاريعها.

**الحل:** إضافة `d.projects?.association_id === user!.id` في الفلتر ضمن `src/hooks/useMyDisputes.ts`.

### 2. صفحة الشكاوى - الجمعيات لا تستطيع رفع شكاوى
**المشكلة:** عند رفع شكوى جديدة، يُستخدم `useMyAssignedProjects` الذي يجلب المشاريع حيث `assigned_provider_id === user.id`. الجمعيات ليست مقدمي خدمة فلن تظهر لهم أي مشاريع في القائمة.

**الحل:** تعديل صفحة `src/pages/MyDisputes.tsx` لاستخدام hook مختلف حسب الدور:
- للجمعيات: جلب المشاريع عبر `useProjects` (التي تستخدم `association_id`)
- لمقدمي الخدمة: البقاء على `useMyAssignedProjects`

### 3. فلتر حالة المشاريع عند رفع شكوى
**المشكلة:** حالياً يجلب `useMyAssignedProjects("in_progress")` فقط. الجمعية قد تحتاج لرفع شكوى على مشاريع بحالات أخرى مثل `completed`.

**الحل:** تمرير قيم حالات إضافية عند جلب المشاريع لرفع الشكاوى (in_progress, completed).

### 4. Realtime غير مفعل لجداول مهمة
**المشكلة:** Realtime مفعل فقط لـ `notifications`, `edit_requests`, `messages`. جداول مهمة مثل `support_tickets`, `disputes`, `escrow_transactions` لا تحدث بشكل فوري.

**الحل:** إضافة `support_tickets` و `disputes` إلى Realtime publication ليتمكن المستخدمون من رؤية التحديثات فوراً.

### 5. عدم إبطال كاش الفواتير عند تحرير الضمان
**المشكلة:** عند تحرير الضمان المالي (escrow release) وتوليد فاتورة، لا يتم إبطال كاش `my-invoices`، فلن تظهر الفاتورة الجديدة فوراً للمستخدم.

**الحل:** إضافة invalidation لـ `my-invoices` في `useGenerateInvoice` hook.

### 6. عدم إبطال كاش الأرباح عند تحرير الضمان
**المشكلة:** `useReleaseEscrow` لا يبطل كاش `earnings` ولا `provider-stats`، فالأرباح لا تتحدث فوراً بعد التحرير.

**الحل:** إضافة invalidation لـ `earnings` و `provider-stats` في `useReleaseEscrow`.

### 7. عدم إبطال كاش طلبات السحب عند الموافقة
**المشكلة:** `useUpdateWithdrawalStatus` يبطل فقط `admin-withdrawals` ولا يبطل `withdrawals` الخاص بمقدم الخدمة.

**الحل:** إضافة invalidation لـ `withdrawals` في `useUpdateWithdrawalStatus`.

## التفاصيل التقنية

### الملفات المتأثرة:

1. **`src/hooks/useMyDisputes.ts`** - إضافة فلتر `association_id` للجمعيات
2. **`src/pages/MyDisputes.tsx`** - استخدام hook المشاريع المناسب حسب الدور (useProjects للجمعيات)
3. **`src/hooks/useInvoices.ts`** - إضافة cache invalidation لـ `my-invoices`
4. **`src/hooks/useEscrow.ts`** - إضافة cache invalidation لـ `earnings` و `provider-stats`
5. **`src/hooks/useWithdrawals.ts`** - إضافة cache invalidation لـ `withdrawals`
6. **Migration SQL** - إضافة `support_tickets` و `disputes` إلى Realtime

### تفصيل التعديلات:

**useMyDisputes.ts:**
```text
// قبل
filter: raised_by === user.id || assigned_provider_id === user.id

// بعد  
filter: raised_by === user.id || assigned_provider_id === user.id || association_id === user.id
```

**MyDisputes.tsx:**
```text
// إضافة useAuth للتحقق من الدور
// إذا youth_association: جلب المشاريع بحالات in_progress أو completed
// إذا service_provider: استخدام useMyAssignedProjects كما هو
```

**useEscrow.ts - useReleaseEscrow:**
```text
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["escrow"] });
  qc.invalidateQueries({ queryKey: ["earnings"] });
  qc.invalidateQueries({ queryKey: ["provider-stats"] });
}
```

**useInvoices.ts - useGenerateInvoice:**
```text
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["invoices"] });
  qc.invalidateQueries({ queryKey: ["my-invoices"] });
}
```

**useWithdrawals.ts - useUpdateWithdrawalStatus:**
```text
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
  qc.invalidateQueries({ queryKey: ["withdrawals"] });
}
```

**Migration:**
```text
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
```
