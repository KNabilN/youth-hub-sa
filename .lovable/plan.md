

## الخطة: تحسين إدارة طلبات السحب (قبول مع إرفاق ملف + رفض مع سبب)

### المتطلبات
1. **عند القبول**: يجب على الأدمن إرفاق ملف إيصال تحويل (يُخزن في storage ويصل رابطه لمزود الخدمة)
2. **عند الرفض**: يجب على الأدمن كتابة سبب الرفض (يُرسل كإشعار نصي لمزود الخدمة)

### التغييرات المطلوبة

#### 1. Migration — إضافة أعمدة جديدة
```sql
ALTER TABLE withdrawal_requests
  ADD COLUMN receipt_url text DEFAULT '',
  ADD COLUMN rejection_reason text DEFAULT '';
```

#### 2. Storage Bucket
إنشاء bucket باسم `withdrawal-receipts` (خاص، غير عام) لتخزين إيصالات التحويل.

#### 3. تعديل `src/pages/admin/AdminFinance.tsx`
- **زر الموافقة**: يفتح Dialog لرفع ملف الإيصال → بعد الرفع يتم تحديث الحالة إلى `approved` مع حفظ `receipt_url`
- **زر الرفض**: يفتح Dialog لكتابة سبب الرفض → بعد الإرسال يتم تحديث الحالة إلى `rejected` مع حفظ `rejection_reason` وإرسال إشعار نصي للمزود يتضمن السبب

#### 4. تعديل `src/hooks/useWithdrawals.ts`
- تحديث `useUpdateWithdrawalStatus` لقبول `receipt_url` و `rejection_reason` كحقول اختيارية

#### 5. تعديل `src/pages/Earnings.tsx` (واجهة المزود)
- عند حالة `approved`/`processed`: عرض زر لتحميل إيصال التحويل
- عند حالة `rejected`: عرض سبب الرفض

#### 6. الإشعارات
- الإشعار الموجود بالفعل عبر trigger `notify_on_withdrawal_change` يغطي الحالات. سيتم تعديل trigger الرفض ليتضمن سبب الرفض من عمود `rejection_reason`.

