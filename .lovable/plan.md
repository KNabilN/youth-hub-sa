

## المشكلة

1. **خطأ "Expected number, received nan"**: حقل المبلغ يبدأ بقيمة `undefined as any` مما يسبب خطأ عند الإرسال
2. **المبلغ لا يتعبأ تلقائياً**: عند اختيار طلب جمعية، يجب تعبئة المبلغ بميزانية الطلب تلقائياً
3. **لا توجد معلومات عن المنح المتاحة**: المانح لا يرى كم تم التبرع لهذا المشروع من قبل، ليحدد المبلغ المناسب

## الحل

### تعديل `src/components/donor/DonationForm.tsx`

1. **إصلاح خطأ NaN**: تغيير `defaultValues.amount` من `undefined as any` إلى `undefined` مع تعديل schema ليقبل NaN gracefully (استخدام `.min(1)` بدل `.positive()` أو معالجة الحالة)

2. **تعبئة المبلغ تلقائياً عند اختيار الطلب**: عند اختيار مشروع من القائمة، تعيين `form.setValue("amount", project.budget)` تلقائياً إذا كان للمشروع ميزانية

3. **عرض بطاقة معلومات المنحة للمشروع**: إضافة query جديد يجلب إجمالي المنح المتاحة لهذا المشروع من `donor_contributions` (بحالة `available`) وعرض:
   - ميزانية المشروع
   - إجمالي المنح المتاحة من جميع المانحين
   - المبلغ المتبقي المطلوب

```text
┌────────────────────────────────────┐
│ معلومات المنحة لهذا الطلب          │
│ ميزانية الطلب:     10,000 ر.س     │
│ المنح المتاحة:      6,000 ر.س     │
│ المتبقي المطلوب:    4,000 ر.س     │
└────────────────────────────────────┘
```

4. **تحسين اختيار المشروع**: في `onSelect` للمشروع، استدعاء `form.setValue("amount", project.budget)` وإظهار الميزانية بجانب اسم المشروع في القائمة

### التفاصيل التقنية

**Query جديد داخل DonationForm** لجلب المنح الموجودة للمشروع:
```typescript
const { data: projectGrants } = useQuery({
  queryKey: ["project-grants-summary", selectedProjectId],
  queryFn: async () => {
    const { data } = await supabase
      .from("donor_contributions")
      .select("amount, donation_status")
      .eq("project_id", selectedProjectId!)
      .in("donation_status", ["available", "reserved", "pending"]);
    const totalAvailable = (data ?? []).reduce((s, c) => s + Number(c.amount), 0);
    return { totalAvailable };
  },
  enabled: !!selectedProjectId,
});
```

**تعبئة المبلغ التلقائية**: في `onSelect` للمشروع
```typescript
onSelect={() => {
  field.onChange(project.id);
  if (project.budget) {
    form.setValue("amount", project.budget);
  }
  setProjectOpen(false);
}}
```

**عرض اسم المشروع + الميزانية** في القائمة المنسدلة:
```
اسم المشروع — 10,000 ر.س
```

### الملفات المتأثرة
- `src/components/donor/DonationForm.tsx` — كل التعديلات في هذا الملف

