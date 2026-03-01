

# تطبيق فلتر المناطق على جميع الرسومات البيانية والتصدير

## المشكلة الحالية
فلتر المنطقة يعمل فقط على رسم "الطلبات حسب الحالة" ورسم "الطلبات حسب المنطقة" وتصدير CSV للطلبات. باقي الرسومات والتصدير لا تتأثر بالفلتر.

## الحل المقترح

### الرسومات التي ستتأثر بفلتر المنطقة

| الرسم البياني | طريقة الربط بالمنطقة |
|---|---|
| الطلبات حسب الحالة | مباشر - `projects.region_id` (موجود) |
| الطلبات حسب المنطقة | مباشر (موجود) |
| الخدمات حسب التصنيف | مباشر - `micro_services.region_id` |
| حالة الخدمات | مباشر - `micro_services.region_id` |
| المنح الشهرية | عبر الطلبات - `donor_contributions.project_id` -> `projects.region_id` |
| المعاملات المالية الشهرية | عبر الطلبات - `escrow_transactions.project_id` -> `projects.region_id` |
| تحليلات المانحين | عبر الطلبات - `donor_contributions.project_id` -> `projects.region_id` |
| مساهمات المانحين | نفس الطريقة |

**لن يتأثر بالفلتر:**
- المستخدمين حسب الدور (لا توجد علاقة مباشرة بالمنطقة)
- توزيع أسعار الساعة (بيانات عامة لمقدمي الخدمات)

### التصدير (CSV) الذي سيتأثر

| التصدير | الطريقة |
|---|---|
| تصدير الطلبات | موجود بالفعل |
| تصدير الخدمات | فلتر `region_id` مباشر |
| تصدير المالية (الضمان) | عبر `project_id` -> `projects.region_id` |
| تصدير الفواتير | عبر `escrow_id` -> `escrow_transactions.project_id` -> `projects.region_id` |

**PDF:** سيُصدّر البيانات المفلترة تلقائياً لأنه يعتمد على نفس البيانات المعروضة.

---

### التفاصيل التقنية

#### ملف واحد: `src/pages/admin/AdminReports.tsx`

**1. إضافة دالة مساعدة لجلب معرّفات الطلبات حسب المنطقة:**

عند اختيار منطقة، نجلب أولاً قائمة `project_id` المرتبطة بتلك المنطقة، ثم نستخدمها لتصفية الجداول المرتبطة (الضمان، المنح).

```text
regionId selected?
    |
    YES --> fetch project IDs where region_id = regionId
    |         |
    |         v
    |    use .in("project_id", projectIds) on:
    |      - escrow_transactions
    |      - donor_contributions
    |
    NO --> no filter applied
```

**2. تعديل الاستعلامات:**

- `servicesByCategory`: إضافة `if (regionId) q = q.eq("region_id", regionId)`
- `serviceApprovalStats`: نفس الشيء
- `monthlyDonations`: جلب project IDs أولاً ثم `.in("project_id", ids)`
- `monthlyEscrow`: نفس الطريقة
- `donorAnalytics`: نفس الطريقة
- إضافة `regionId` لـ `queryKey` في كل استعلام لإعادة الجلب عند تغيير الفلتر

**3. تعديل دوال التصدير CSV:**

- `exportServices`: إضافة فلتر المنطقة
- `exportFinancial`: فلتر عبر project IDs
- `exportInvoices`: فلتر عبر escrow -> project IDs

**4. استعلام مشترك لجلب project IDs حسب المنطقة:**

إنشاء `useQuery` لجلب قائمة معرّفات الطلبات عند اختيار منطقة، يُعاد استخدامه في كل الاستعلامات المرتبطة.

