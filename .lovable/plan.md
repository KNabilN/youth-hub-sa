

# إضافة ميزة التظليل والعودة لجميع صفحات القوائم المتبقية

الميزة تعمل حالياً في 5 صفحات إدارية فقط. سنضيفها لبقية الصفحات التي تحتوي على قوائم وتنقل لصفحات تفصيلية.

## الصفحات المتبقية

### صفحات المستخدمين (غير الإدارية)
| الصفحة | نوع القائمة | صفحة التفاصيل |
|--------|-------------|---------------|
| `SupportTickets.tsx` | Cards (TicketCard) | `/tickets/:id` |
| `MyProjects.tsx` | Cards | `/projects/:id` |
| `MyBids.tsx` | Cards | `/projects/:id` (عبر رابط الطلب) |
| `MyDisputes.tsx` | Cards | لا يوجد تفاصيل منفصلة — يُستبعد |
| `Contracts.tsx` | Cards (ContractCard) | لا يوجد تفاصيل منفصلة — يُستبعد |
| `MyServices.tsx` | Cards (MyServiceCard) | `/services/:id` |

### صفحات إدارية إضافية
| الصفحة | ملاحظة |
|--------|--------|
| `AdminFinance.tsx` | جداول متعددة لكن بدون صفحات تفاصيل — يُستبعد |
| `AdminNotifications.tsx` | بدون صفحات تفاصيل — يُستبعد |

## التغييرات لكل صفحة

### 1. `SupportTickets.tsx`
- إضافة `useListHighlight("my-tickets")`
- تغيير `onClick` في TicketCard لاستخدام `saveAndNavigate`
- إضافة `id="row-${t.id}"` على عنصر TicketCard wrapper

### 2. `MyProjects.tsx`
- إضافة `useListHighlight("my-projects")`
- تغيير `<Link>` إلى `onClick` مع `saveAndNavigate`
- إضافة `id="row-${project.id}"` على Card

### 3. `MyServices.tsx`
- إضافة `useListHighlight("my-services")`
- تمرير `saveAndNavigate` إلى MyServiceCard أو لف البطاقة بـ onClick
- إضافة `id="row-${s.id}"` على Card

### 4. `MyBids.tsx`
- إضافة `useListHighlight("my-bids")`
- إضافة `id="row-${bid.id}"` على Card
- تغيير رابط "عرض الطلب" لاستخدام `saveAndNavigate`

### 5. صفحات التفاصيل المقابلة
- `TicketDetail.tsx` — زر العودة يستخدم `navigate(-1)`
- `ProjectDetails.tsx` — زر العودة يستخدم `navigate(-1)`
- `ServiceDetail.tsx` — زر العودة يستخدم `navigate(-1)`

## التفاصيل التقنية
- الـ CSS animation `row-highlight` موجود بالفعل ويعمل على أي عنصر
- Hook `useListHighlight` يبحث عن عنصر بـ `id="row-${id}"` — يعمل على Cards وTables
- لا حاجة لتغيير `usePagination` لأن معظم هذه الصفحات تستخدم pagination بسيط أو بدون pagination

### الملفات المتأثرة (8 ملفات)
- `src/pages/SupportTickets.tsx`
- `src/pages/MyProjects.tsx`
- `src/pages/MyServices.tsx`
- `src/pages/MyBids.tsx`
- `src/pages/TicketDetail.tsx`
- `src/pages/ProjectDetails.tsx`
- `src/pages/ServiceDetail.tsx`
- `src/pages/ProjectBidView.tsx` (إن كان يحتوي على زر عودة)

