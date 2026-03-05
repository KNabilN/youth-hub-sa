

# خطة: أتمتة جمع بيانات الفرضيات وعرض المؤشرات الحية

## ملخص
تحويل صفحة الفرضيات من إدخال يدوي إلى لوحة مؤشرات آلية تجمع البيانات من جداول النظام وتعرض القيم الفعلية والعلاقات لكل فرضية.

## تصنيف الفرضيات حسب القابلية للأتمتة

### قابلة للأتمتة الكاملة (17 فرضية):

| # | الفرضية | مصدر البيانات | المؤشر المحسوب |
|---|---------|---------------|----------------|
| H1 | نشاط المزودين | `bids`, `user_roles` | % مزودين نشطين (قدموا عروض آخر 30 يوم) + معدل بقاء 90 يوم |
| H2 | سرعة أول عرض | `projects.created_at` vs `min(bids.created_at)` | متوسط ساعات طلب→أول عرض + % خلال 48 ساعة + معدل إغلاق مرتبط |
| H3 | أثر عدد المزودين | `bids`, `user_roles` شهرياً | رسم بياني: عدد مزودين نشطين vs زمن أول عرض vs إغلاق |
| H5 | باقات خاصة | `micro_services.packages` | % مزودين لديهم باقات ≥1 + مقارنة تحويل (مع/بدون) |
| H7 | جودة التنفيذ | `ratings` | % تقييم 4/5+ + % شكاوى (نزاعات/مشاريع) |
| H8 | النزاعات | `projects`, `disputes`, `dispute_status_log` | % بلا نزاع + متوسط أيام الحل + % حُلت ≤7 أيام |
| H9 | التزام المواعيد | `contracts`, `project_deliverables`, `ratings` | % تسليم في الوقت + متوسط تقييم timing_score + % إعادة شراء |
| H10 | حوافز الاستجابة | `bids`, `projects` | معدل استجابة ساعات + ارتباط بالإغلاق |
| H11 | تكرار الطلب | `projects` per association | طلبات/90 يوم لكل جمعية + متوسط |
| H12 | تحويل تسجيل→طلب | `profiles.created_at` vs `projects.created_at` | % جمعيات تحولت لأول طلب + متوسط الأيام |
| H14 | نوع الخدمة | `micro_services.service_type`, `escrow_transactions` | مقارنة إغلاق fixed_price vs packages + متوسط السلة |
| H15 | شفافية التسعير | `bids` status=rejected | % عروض مرفوضة + متوسط زمن قرار (طلب→قبول عرض) |
| H17 | دعم وإعادة شراء | `projects` per association, `support_tickets` | % إعادة شراء خلال 120 يوم + عدد تذاكر/مشروع |
| H18 | الدفع الذاتي | `escrow_transactions` | % ذاتي (بدون grant) + اتجاه شهري |
| H23 | فض النزاعات | `disputes`, `dispute_status_log` | زمن حل + % ≤7 أيام + معدل انسحاب |
| H24 | الضمانات | `escrow_transactions`, `disputes` | مقارنة إغلاق مع/بدون escrow + نزاعات |
| H25 | جودة البيانات | `profiles` fields completeness | % اكتمال الملفات + % حقول فارغة |

### تحتاج بيانات إضافية أو يدوية (9 فرضيات):
H4, H6, H13, H16, H19, H20, H21, H22, H26 — تبقى يدوية مع إمكانية إدخال القيمة

---

## التغييرات المطلوبة

### 1. إعادة كتابة `useHypothesisMetrics` بالكامل
توسيع الـ hook ليجمع بيانات شاملة من كل الجداول ذات الصلة ويعيد كائن metrics غني لكل فرضية:

```text
metrics = {
  h1: { activeProviderPct, retentionPct, totalProviders, activeCount },
  h2: { avgHoursToFirstBid, pctWithin48h, closureWithFast, closureWithSlow },
  h3: { monthlyTrend: [{month, activeProviders, avgFirstBidHours, closureRate}] },
  h5: { providersWithPackages, totalProviders, pct },
  h7: { ratingPct, complaintsPct, totalRatings },
  h8: { noDisputePct, avgResolutionDays, pctResolvedIn7, totalDone },
  h9: { onTimePct, avgTimingScore, repeatPurchasePct },
  h11: { avgRequestsPer90Days, activeAssociations },
  h12: { conversionPct, avgDaysToFirstProject, totalAssociations },
  h14: { fixedClosureRate, packageClosureRate, fixedAvgValue, packageAvgValue },
  h15: { rejectionPct, avgDecisionDays },
  h17: { repeatPurchasePct120, avgTicketsPerProject },
  h18: { selfPayPct, monthlyTrend },
  h23: { avgResolutionDays, pctIn7Days, withdrawalRate },
  h24: { closureWithEscrow, closureWithout, disputesWithEscrow, disputesWithout },
  h25: { profileCompleteness, avgFieldsFilled },
  ...
}
```

**Queries needed** (all via Supabase client, admin RLS):
- `projects` with `created_at`, `status`, `association_id`, `assigned_provider_id`
- `bids` with `created_at`, `project_id`, `provider_id`, `status`
- `disputes` + `dispute_status_log` for resolution times
- `ratings` for quality scores
- `escrow_transactions` for payment analysis
- `contracts` + `project_deliverables` for timeline compliance
- `profiles` for completeness checks
- `user_roles` for provider/association counts
- `micro_services` for package analysis
- `support_tickets` for ticket counts

### 2. تحديث `AdminHypotheses.tsx`
- بدلاً من عرض رقم واحد "مؤشر آلي" — عرض **بطاقة مؤشرات متعددة** لكل فرضية
- كل فرضية تعرض مؤشراتها الخاصة بشكل مرئي (أرقام + أشرطة تقدم + اتجاهات)
- إضافة مكون `MetricsDashboard` داخل كل بطاقة فرضية يعرض:
  - القيم الفعلية المحسوبة
  - مقارنة مع معيار النجاح
  - مؤشر بصري (أخضر/أصفر/أحمر) لمدى تحقق المعيار
  - العلاقات بين المتغيرات (مثل: زمن الاستجابة ↔ الإغلاق)
- الفرضيات بدون بيانات آلية تبقى بالحقول اليدوية

### 3. مكون جديد `HypothesisMetricsPanel`
مكون يستقبل رقم الفرضية + بيانات المؤشرات ويعرض:
- صف مؤشرات KPI صغيرة (2-4 أرقام)
- شريط تقدم ملون نحو المعيار
- ملاحظة تلقائية عن مدى التحقق

---

## ملخص الملفات

| الملف | التغيير |
|---|---|
| `src/hooks/useHypotheses.ts` | إعادة كتابة `useHypothesisMetrics` بالكامل لجمع 15+ مؤشر |
| `src/pages/admin/AdminHypotheses.tsx` | تحديث البطاقات لعرض مؤشرات متعددة لكل فرضية + ألوان تحقق |

