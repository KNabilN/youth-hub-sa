
# اصلاح مشكلة عدم ظهور العقود

## المشكلة
عند قبول العرض، يحاول الكود انشاء عقد جديد في جدول `contracts`، لكن سياسة الامان (RLS) لا تسمح للجمعيات بالادراج. السياسات الحالية:
- SELECT فقط لاطراف العقد
- ALL للمشرف فقط

لذلك يفشل الادراج بصمت ولا يظهر اي عقد.

## الحل
اضافة سياسات RLS جديدة تسمح بـ:

1. **INSERT** - السماح للجمعيات بانشاء عقود (حيث `association_id = auth.uid()`)
2. **UPDATE** - السماح لاطراف العقد بتحديثه (للتوقيع)

## التفاصيل التقنية

### Migration جديد:
```sql
-- السماح للجمعيات بانشاء عقود
CREATE POLICY "Associations can create contracts"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (association_id = auth.uid());

-- السماح لاطراف العقد بتحديثه (التوقيع)
CREATE POLICY "Contract parties can update"
  ON public.contracts FOR UPDATE TO authenticated
  USING (association_id = auth.uid() OR provider_id = auth.uid());
```

### تحسين معالجة الاخطاء في `useBids.ts`:
اضافة التحقق من نتيجة ادراج العقد ورمي خطأ اذا فشل، حتى لا يفشل بصمت.

## الملفات المتأثرة
- Migration جديد (سياسات RLS)
- `src/hooks/useBids.ts` (تحسين معالجة الاخطاء)
