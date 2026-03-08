

## ضبط تدفق شراء الجمعية للخدمة — إنشاء عرض تلقائي وإشعار المزود

### المشكلة الحالية
عند شراء الجمعية لخدمة من السوق (بأي طريقة دفع):
1. يتم إنشاء مشروع مع `assigned_provider_id` لكن **لا يُنشأ سجل عرض (bid)** — فتظهر تبويب العروض فارغة
2. **لا يُرسل إشعار لمزود الخدمة** بأن خدمته اشتُريت وأنه مُعيَّن على المشروع
3. المزود لا يظهر كـ "مقبول" في صفحة العروض
4. مسار التحويل البنكي (بعد موافقة الأدمن) لا يُنشئ العقد للجمعيات

### الحل
إنشاء **عرض تلقائي بحالة "مقبول"** لمزود الخدمة في كل مرة تشتري فيها جمعية خدمة، مع إشعار المزود. هذا يجعل الفلو مطابق تماماً لمسار قبول العرض اليدوي.

### التغييرات المطلوبة

#### 1. `src/hooks/usePurchaseService.ts` (الدفع الإلكتروني المباشر + رصيد المنح)
بعد إنشاء المشروع والعقد، إضافة:
- إنشاء سجل `bid` بحالة `accepted` مع بيانات المزود والسعر
- إرسال إشعار لمزود الخدمة: "تم شراء خدمتك وتعيينك على مشروع — يرجى مراجعة العقد وتوقيعه"

#### 2. `supabase/functions/moyasar-verify-payment/index.ts` — `processCheckout`
نفس التعديل: بعد إنشاء المشروع والعقد (في مسار `isAssociation`)، إنشاء bid مقبول + إشعار للمزود

#### 3. `src/pages/Checkout.tsx` — مسار `grant_balance`
نفس التعديل: إضافة إنشاء bid مقبول + إشعار بعد إنشاء المشروع والعقد

#### 4. `src/hooks/useBankTransfer.ts` — `useCreateBankTransfer`
- في مسار الجمعية (`isAssociation`): إضافة إنشاء العقد (مفقود حالياً)
- إنشاء bid مقبول

#### 5. `src/hooks/useBankTransfer.ts` — `useApproveBankTransfer`
- في السيناريو 2 (مشروع مع مزود): بعد إنشاء العقد وتحديث حالة المشروع، إنشاء bid مقبول إذا لم يكن موجوداً + إشعار

### شكل سجل العرض التلقائي
```typescript
await supabase.from("bids").insert({
  project_id: projectId,
  provider_id: providerId,
  price: amount,
  timeline_days: 30,
  cover_letter: "عرض تلقائي — شراء خدمة من السوق",
  status: "accepted",
});
```

### شكل الإشعار
```typescript
await supabase.from("notifications").insert({
  user_id: providerId,
  message: `تم شراء خدمتك "${serviceTitle}" وتعيينك على مشروع جديد — يرجى مراجعة العقد وتوقيعه`,
  type: "service_purchased_assigned",
  entity_id: projectId,
  entity_type: "project",
});
```

### الملفات المتأثرة
| # | الملف | التغيير |
|---|---|---|
| 1 | `src/hooks/usePurchaseService.ts` | إضافة bid مقبول + إشعار المزود |
| 2 | `supabase/functions/moyasar-verify-payment/index.ts` | نفس التعديل في `processCheckout` |
| 3 | `src/pages/Checkout.tsx` | نفس التعديل لمسار `grant_balance` |
| 4 | `src/hooks/useBankTransfer.ts` | إضافة عقد + bid في `useCreateBankTransfer` + bid في `useApproveBankTransfer` |

