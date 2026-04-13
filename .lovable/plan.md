

# نقل البيانات البنكية إلى جدول منفصل وآمن

## المشكلة
حقول البنك (`bank_name`, `bank_account_number`, `bank_iban`, `bank_account_holder`) موجودة في جدول `profiles` المتاح لجميع المستخدمين المسجلين عبر RLS. رغم أن الواجهة لا تعرضها لغير أصحابها، إلا أن أي مستخدم يمكنه استدعاء API مباشرة والوصول لهذه البيانات الحساسة.

## الحل — نقل الحقول إلى جدول `bank_details` منفصل

### 1. Migration — إنشاء جدول `bank_details` ونقل البيانات

```sql
CREATE TABLE public.bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bank_name text DEFAULT '',
  bank_account_number text DEFAULT '',
  bank_iban text DEFAULT '',
  bank_account_holder text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

-- المالك فقط يقرأ/يعدّل بياناته + الأدمن
CREATE POLICY "Owner read own bank details" ON bank_details FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Owner upsert own bank details" ON bank_details FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner update own bank details" ON bank_details FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));

-- نقل البيانات الموجودة
INSERT INTO bank_details (user_id, bank_name, bank_account_number, bank_iban, bank_account_holder)
SELECT id, bank_name, bank_account_number, bank_iban, bank_account_holder
FROM profiles
WHERE bank_name != '' OR bank_account_number != '' OR bank_iban != '' OR bank_account_holder != '';

-- حذف الأعمدة من profiles
ALTER TABLE profiles DROP COLUMN bank_name;
ALTER TABLE profiles DROP COLUMN bank_account_number;
ALTER TABLE profiles DROP COLUMN bank_iban;
ALTER TABLE profiles DROP COLUMN bank_account_holder;
```

### 2. تحديث Trigger الإشعار المالي
تعديل `notify_on_profile_financial_change` ليعمل على جدول `bank_details` بدلاً من `profiles`.

### 3. تحديث الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `src/pages/Profile.tsx` | قراءة وكتابة البيانات البنكية من/إلى `bank_details` بدلاً من `profiles` |
| `src/hooks/useProfile.ts` | إزالة `FINANCIAL_FIELDS` و `hasFinancialChanges` — النقل للجدول الجديد |
| `src/hooks/useProfileCompleteness.ts` | جلب `bank_details` منفصلاً للتحقق من اكتمال الملف |
| `src/hooks/useWithdrawals.ts` | تغيير الـ join ليجلب من `bank_details` بدلاً من `profiles` |
| `src/pages/admin/AdminFinance.tsx` | تحديث عرض البيانات البنكية من الجدول الجديد |
| `src/hooks/useHypothesisMetrics.ts` | إزالة `bank_iban` من استعلام profiles |
| `src/components/admin/ExportUsersDialog.tsx` | لا تغيير (لا تصدّر بيانات بنكية حالياً) |

### النتيجة
- البيانات البنكية محمية بـ RLS خاص: المالك والأدمن فقط
- لا يمكن لأي مستخدم آخر الوصول للبيانات عبر API المباشر
- الواجهة تعمل بنفس الطريقة دون تغيير في تجربة المستخدم

