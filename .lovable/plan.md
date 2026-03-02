
# اظهار اسم الجمعية وتفاصيل المشروع في صفحة المعاملات المادية

## التغييرات المطلوبة

### 1. تحديث `src/hooks/useEarnings.ts`
- توسيع الـ select ليشمل بيانات المشروع الاضافية: عنوان المشروع، رقم الطلب، الميزانية، التصنيف، والمنطقة
- جلب اسم الجمعية (صاحبة المشروع) عبر `profiles` من خلال `projects.association_id`
- الـ select الجديد:
```
escrow_transactions.*, projects(title, request_number, budget, association_id, categories(name), regions(name), profiles!projects_association_id_fkey(full_name, organization_name))
```
- ملاحظة: بما أن لا يوجد foreign key صريح بين projects و profiles، سنجلب بيانات الجمعية بشكل منفصل أو نستخدم payer_id من escrow مباشرة لجلب اسم الجمعية

### 2. تحديث `src/components/provider/EarningsSummary.tsx`
- تحديث الـ interface ليشمل الحقول الجديدة (اسم الجمعية، رقم الطلب، التصنيف، المنطقة)
- اظهار اسم الجمعية تحت عنوان المشروع
- اظهار رقم الطلب بخط mono واضح
- اظهار التصنيف والمنطقة كـ Badges صغيرة
- تحسين تصميم كل صف في سجل المعاملات ليعرض المعلومات الاضافية بشكل منظم

## التفاصيل التقنية

بما أن جدول `escrow_transactions` يحتوي على `payer_id` (الجمعية) و `project_id`، سنجلب:
- من `projects`: العنوان، رقم الطلب، التصنيف، المنطقة
- نجلب اسم الجمعية عبر الـ `payer_id` مباشرة من جدول `profiles`

الـ query النهائي:
```sql
select *, projects(title, request_number, categories(name), regions(name))
from escrow_transactions
where payee_id = user_id
```

ثم نجلب أسماء الجمعيات بشكل منفصل باستخدام `payer_id` ← `profiles(full_name, organization_name)`

او الأسهل: نضيف select للـ profiles مباشرة عبر payer_id:
```
escrow_transactions select: "*, projects(title, request_number, categories(name), regions(name)), profiles!escrow_transactions_payer_id_fkey(full_name, organization_name)"
```

بما أنه لا يوجد foreign key صريح بين escrow_transactions و profiles، سنستخدم طريقة بديلة: نجلب payer_id مع البيانات ثم نعمل query ثاني لجلب أسماء الجمعيات، أو نضيف الاسم مباشرة في الـ select عبر inner query.

الحل الأبسط: توسيع select المشروع ليشمل `association_id` ثم عمل query منفصل لجلب الأسماء، أو استخدام profiles مباشرة كـ join hint.

### الشكل النهائي لكل معاملة:
```text
+--------------------------------------------------+
| [RQ-20260301-0001]  عنوان المشروع                |
| جمعية الشباب السعودي                              |
| [تقنية معلومات] [الرياض]          محتجز  500 ر.س |
+--------------------------------------------------+
```
