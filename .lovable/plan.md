

## المشكلة

عند استهلاك المنح عبر `usePayFromGrants`، لا يتم تسجيل `project_id` أو `service_id` في صفوف المساهمات المستهلكة:

1. **الاستهلاك الكامل** (سطر 48-52): يُحدّث `donation_status` فقط إلى `consumed` بدون تعيين `project_id`/`service_id`
2. **الاستهلاك الجزئي** (سطر 67-74): يُنشئ صف جديد بدون `project_id`/`service_id`

النتيجة: كل المنح المستهلكة تظهر كـ "دعم عام" في تبويب "استخدام المنح" لأن الحقول فارغة.

## الحل

### تعديل `src/hooks/usePayFromGrants.ts`

تمرير `projectId` و `serviceId` عند استهلاك المساهمات:

1. **الاستهلاك الكامل**: إضافة `project_id` و `service_id` في `update` بجانب `donation_status`
2. **الاستهلاك الجزئي**: إضافة `project_id` و `service_id` في `insert` للصف المستهلك الجديد

```typescript
// Full consumption
.update({ 
  donation_status: "consumed",
  project_id: projectId || null,
  service_id: serviceId || null,
})

// Partial consumption - new consumed row
.insert({
  donor_id: c.donor_id,
  association_id: c.association_id,
  amount: usedAmount,
  donation_status: "consumed",
  project_id: projectId || null,
  service_id: serviceId || null,
})
```

### الملفات المتأثرة
- `src/hooks/usePayFromGrants.ts`

