
# اضافة نظام ترقيم فريد للتذاكر والطلبات (المشاريع)

## الفكرة
اضافة رقم فريد مقروء لكل تذكرة دعم ولكل طلب (مشروع) لتسهيل التواصل والمتابعة، بنفس نمط رقم الفاتورة الموجود حالياً.

## التغييرات المطلوبة

### 1. قاعدة البيانات (Migration)

اضافة عمودين جديدين مع تعبئة تلقائية:

- **support_tickets**: اضافة عمود `ticket_number` (text, unique, not null)
  - يُعبأ تلقائياً عبر trigger بصيغة: `TK-20260302-0001`
  - رقم تسلسلي يومي يبدأ من 1 كل يوم

- **projects**: اضافة عمود `request_number` (text, unique, not null)
  - يُعبأ تلقائياً عبر trigger بصيغة: `RQ-20260302-0001`
  - رقم تسلسلي يومي يبدأ من 1 كل يوم

- انشاء دالتين (functions) للتوليد التلقائي:
  - `generate_ticket_number()` - trigger على INSERT
  - `generate_request_number()` - trigger على INSERT

- تعبئة الأرقام للسجلات الموجودة حالياً (backfill)

### 2. تعديلات الواجهة

**التذاكر:**
- `TicketCard.tsx`: عرض رقم التذكرة بجانب الموضوع
- `AdminTickets.tsx`: اضافة عمود "رقم التذكرة" في الجدول + البحث بالرقم
- `AdminTicketDetail.tsx`: عرض رقم التذكرة في الـ Hero Section
- `SupportTickets.tsx`: تمرير `ticket_number` للـ TicketCard

**الطلبات (المشاريع):**
- `ProjectCard.tsx`: عرض رقم الطلب
- `ProjectDetails.tsx`: عرض رقم الطلب في الرأس
- `AdminProjects.tsx`: عرض رقم الطلب في الجدول
- `AdminProjectDetail.tsx`: عرض رقم الطلب

### 3. التفاصيل التقنية

```text
صيغة الأرقام:
  تذاكر: TK-YYYYMMDD-NNNN  (مثال: TK-20260302-0001)
  طلبات: RQ-YYYYMMDD-NNNN  (مثال: RQ-20260302-0012)

Trigger Logic:
  1. يحسب عدد السجلات المُنشأة في نفس اليوم
  2. يضيف 1 للحصول على الرقم التسلسلي
  3. يدمج البادئة + التاريخ + الرقم (4 خانات)
```

### الملفات المتأثرة
- **Migration**: جدول support_tickets + projects (اضافة أعمدة + triggers)
- **تعديل**: `src/components/tickets/TicketCard.tsx`
- **تعديل**: `src/pages/SupportTickets.tsx`
- **تعديل**: `src/pages/admin/AdminTickets.tsx`
- **تعديل**: `src/pages/admin/AdminTicketDetail.tsx`
- **تعديل**: `src/components/projects/ProjectCard.tsx`
- **تعديل**: `src/pages/ProjectDetails.tsx`
- **تعديل**: `src/pages/admin/AdminProjects.tsx`
- **تعديل**: `src/pages/admin/AdminProjectDetail.tsx`
