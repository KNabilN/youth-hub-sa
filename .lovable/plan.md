

## تفعيل التحديث الفوري (Realtime) لجميع التفاعلات بين المستخدمين

### الوضع الحالي
- **جداول مفعّل عليها Realtime:** `messages`, `notifications`, `bid_comments`, `projects`, `contracts`, `time_logs`, `invoices`, `escrow_transactions`, `support_tickets`, `disputes`, `edit_requests`
- **Hooks فيها اشتراك Realtime:** `useMessages`, `useNotifications`, `useBidComments`, `ProjectDetails` (escrow فقط), `AdminProjectDetail`
- **المشكلة:** معظم الـ hooks تعتمد على `invalidateQueries` عند الـ mutation فقط — يعني التحديث يظهر فقط لمن نفّذ الإجراء. الطرف الآخر لازم يعمل refresh.

### الجداول التي تحتاج تفعيل Realtime (Migration)
| الجدول | السبب |
|---|---|
| `bids` | المزود يقدم عرض → الجمعية لازم تشوفه فوراً |
| `project_deliverables` | التسليمات والمراجعات بين الطرفين |
| `grant_requests` | طلبات المنح بين الجمعيات والمانحين |
| `donor_contributions` | التبرعات الواردة |

### الـ Hooks التي تحتاج اشتراك Realtime (كود)

| # | الملف | الاشتراك المطلوب |
|---|---|---|
| 1 | `useProjects.ts` | `useProjects` + `useProject` — الاستماع لتغييرات `projects` (حالة المشروع، تعيين مزود) |
| 2 | `useBids.ts` | `useBids(projectId)` — عرض جديد أو تغيير حالة عرض |
| 3 | `useProviderBids.ts` | `useProviderBids` — المزود يرى تحديث حالة عروضه فوراً |
| 4 | `useAvailableProjects.ts` | `useAvailableProjects` — مشاريع جديدة تظهر فوراً للمزودين |
| 5 | `useMyAssignedProjects.ts` | مشاريع المزود المعيّن عليها |
| 6 | `useContracts.ts` | `useContracts` — توقيع العقود بين الطرفين |
| 7 | `useDeliverables.ts` | تسليمات ومراجعات |
| 8 | `useTimeLogs.ts` | ساعات العمل وموافقات |
| 9 | `useMyDisputes.ts` | النزاعات |
| 10 | `useSupportTickets.ts` | التذاكر |
| 11 | `useConversations` (في `useMessages.ts`) | تحديث قائمة المحادثات عند رسالة جديدة من أي مشروع |

### نمط التنفيذ الموحد
كل hook سيضاف له `useEffect` مع `supabase.channel()`:

```text
useEffect → subscribe to table changes (filter by user/project where applicable)
  → on change: invalidateQueries for the relevant queryKey
  → cleanup: removeChannel
```

**فلترة ذكية** لتقليل الضغط:
- `bids`: فلترة بـ `project_id` عند عرض مشروع محدد
- `projects`: فلترة بـ `association_id` أو `assigned_provider_id` حسب الدور
- `contracts`, `time_logs`, `deliverables`: فلترة بـ `project_id`

### تقييم المخاطر

| الخطر | التقييم | الحل |
|---|---|---|
| كثرة الاشتراكات | منخفض | كل اشتراك يُلغى عند unmount. المستخدم لن يفتح أكثر من 2-3 صفحات |
| حمل على قاعدة البيانات | منخفض | Realtime publication لا يؤثر على أداء الكتابة. الاستعلامات تُنفذ فقط عند وصول تغيير |
| أمان البيانات | لا خطر | Realtime يحترم RLS — المستخدم يستلم أحداث فقط للجداول المسموح له قراءتها |
| تكرار invalidation | منخفض | TanStack Query يدمج الاستعلامات المتكررة تلقائياً (deduplication) |

### الملفات المتأثرة
- **Migration جديد:** تفعيل Realtime لـ `bids`, `project_deliverables`, `grant_requests`, `donor_contributions`
- **11 ملف Hook:** إضافة `useEffect` + `supabase.channel` لكل واحد

