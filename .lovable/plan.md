

## المشكلة

عند محاولة الدفع من رصيد المنح، يفشل الطلب بسبب **عدم وجود صلاحية INSERT للجمعيات** على جدول `donor_contributions`.

### التفصيل التقني
منطق الاستهلاك الجزئي (FIFO) في `usePayFromGrants` يعمل كالتالي:
1. إذا كان مبلغ المساهمة أكبر من المطلوب، يُقسّم الصف إلى جزءين:
   - تحديث الصف الأصلي بالمتبقي (UPDATE) ← يعمل ✓
   - إدراج صف جديد للمبلغ المستهلك (INSERT) ← **يفشل** ✗

سياسات RLS الحالية للجمعيات على `donor_contributions`:
- SELECT ✓ (`association_id = auth.uid()`)
- UPDATE ✓ (`association_id = auth.uid()`)
- **INSERT ✗** — لا توجد سياسة

---

## الحل

### 1. إضافة سياسة RLS للـ INSERT (migration جديد)
```sql
CREATE POLICY "Associations insert consumed contributions"
ON public.donor_contributions
FOR INSERT
TO authenticated
WITH CHECK (
  association_id = auth.uid()
  AND donation_status = 'consumed'
);
```
هذه السياسة تسمح للجمعية بإدراج صفوف جديدة **فقط** بحالة `consumed` (لا يمكنها إضافة أموال جديدة لنفسها).

### 2. تحسين معالجة الأخطاء في `usePayFromGrants.ts`
إضافة `console.error` قبل `throw` لتسهيل التشخيص مستقبلاً، وعرض رسالة الخطأ الفعلية في toast بدلاً من الرسالة العامة.

### الملفات المتأثرة
- Migration جديد — سياسة RLS
- `src/hooks/usePayFromGrants.ts` — تحسين رسائل الخطأ

