

## مراجعة شاملة لتجربة المانح (Donor UX Enhancement)

بعد مراجعة جميع صفحات وتدفقات المانح (7 صفحات):

---

### 1. لوحة التحكم (Dashboard)

| المشكلة | التحسين |
|---------|---------|
| لا يوجد تنبيهات للإجراءات المطلوبة (طلبات واردة، تقارير أثر جديدة) | إضافة `DonorActionItems` يعرض: طلبات منح واردة بانتظار الرد، تقارير أثر جديدة بانتظار المراجعة |
| JourneyBoard لا يعرض عدد تقارير الأثر الفعلي ولا المبلغ الإجمالي | تحسين DonorJourney ليعرض المبلغ الإجمالي بتنسيق عملة وعدد التقارير الفعلي |
| لا يوجد مؤشر "طلبات واردة جديدة" | إضافة بطاقة إحصائية "طلبات واردة" بعدد الطلبات المعلقة |

### 2. المنح (Donations)

| المشكلة | التحسين |
|---------|---------|
| لا يوجد Realtime لتحديث الأرصدة عند موافقة الأدمن على التحويل | إضافة اشتراك Realtime على `donor_contributions` بفلتر `donor_id` |
| لا يوجد pagination لسجل المنح | إضافة PaginationControls |
| لا يوجد فلتر حسب الحالة في جدول المنح | إضافة فلتر (الكل، متاح، محجوز، مستهلك، معلق) |

### 3. طلبات الدعم (GrantRequests)

| المشكلة | التحسين |
|---------|---------|
| لا يوجد Realtime لظهور طلبات جديدة | إضافة اشتراك Realtime على `grant_requests` |
| لا يوجد فلتر حسب الحالة أو النوع (عام/موجه) | إضافة فلتر حالة |
| لا يوجد pagination | إضافة PaginationControls |

### 4. طلبات واردة (MyGrantRequests)

| المشكلة | التحسين |
|---------|---------|
| لا يوجد Realtime | إضافة اشتراك Realtime على `grant_requests` بفلتر `donor_id` |
| لا يوجد فلتر حسب الحالة | إضافة فلتر (الكل، معلقة، تمت الموافقة، ممولة، مرفوضة) |
| لا يوجد pagination | إضافة PaginationControls |

### 5. تقارير الأثر (ImpactReports)

| المشكلة | التحسين |
|---------|---------|
| لا يوجد Realtime لظهور تقارير جديدة | إضافة اشتراك Realtime على `impact_reports` |
| لا يوجد فلتر حسب الجمعية | إضافة فلتر حسب الجمعية |
| لا يوجد pagination | إضافة PaginationControls |

### 6. الجمعيات (Associations)

| المشكلة | التحسين |
|---------|---------|
| لا يظهر إجمالي المنح السابقة لكل جمعية | إضافة badge بإجمالي المنح السابقة للجمعية |
| لا يوجد pagination | إضافة PaginationControls |

### 7. الفواتير (Invoices)

| المشكلة | التحسين |
|---------|---------|
| (مشتركة بين الأدوار — لا تحتاج تحسينات خاصة بالمانح) | — |

---

### أولوية التنفيذ

1. **Dashboard Action Items** — تنبيهات الطلبات الواردة وتقارير الأثر الجديدة
2. **Realtime** — donor_contributions, grant_requests, impact_reports
3. **Donations فلترة + pagination** — فلتر حالة، pagination
4. **GrantRequests + MyGrantRequests** — فلتر، pagination، Realtime
5. **ImpactReports** — فلتر جمعية، pagination
6. **JourneyBoard** — تحسين DonorJourney بالبيانات الفعلية
7. **Associations** — badge المنح السابقة

### التفاصيل التقنية

- Realtime subscriptions تستخدم نفس النمط (`channel` + `invalidateQueries`)
- PaginationControls و usePagination موجودان بالفعل
- لا حاجة لـ migrations جديدة — جميع البيانات متوفرة في الجداول الحالية

