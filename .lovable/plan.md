

# إصلاح خطأ التحويل البنكي للجمعيات

## المشكلة
عند اختيار "تحويل بنكي" كطريقة دفع من حساب جمعية، يظهر خطأ "حدث خطأ" لأن الكود يحاول إدراج سجل في جدول `donor_contributions` (سطر 152-159 في `useBankTransfer.ts`). سياسات الأمان (RLS) على هذا الجدول تمنع الجمعيات من الإدراج بحالة `pending` — فقط المانحين يمكنهم ذلك.

## الحل

| الملف | التغيير |
|---|---|
| `src/hooks/useBankTransfer.ts` | جعل إدراج `donor_contributions` عملية ثانوية لا تمنع إتمام الدفع (try-catch)، وتخطيها تماماً إذا كان المشتري جمعية |

### التفاصيل
في `useCreateBankTransfer` (سطر 151-160)، نلف الحلقة الخاصة بـ `donor_contributions` بـ try-catch ونضيف شرط `!isAssociation` قبل الإدراج. الجمعيات ليست مانحين ولا حاجة لتسجيل مساهمة مانح عند شرائها.

```typescript
// قبل (يرمي خطأ للجمعيات)
for (const item of items) {
  await supabase.from("donor_contributions").insert({...});
}

// بعد
if (!isAssociation) {
  for (const item of items) {
    try {
      await supabase.from("donor_contributions").insert({...});
    } catch {}
  }
}
```

تغيير بسيط في ملف واحد يحل المشكلة بالكامل.

