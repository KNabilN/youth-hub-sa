
# نظام الردود على تذاكر الدعم

## الفكرة
تمكين مدير النظام من الرد على تذاكر الدعم، وتمكين المستخدم من رؤية الردود والتفاعل معها في محادثة مشابهة لنظام الشكاوى.

## قاعدة البيانات

### جدول جديد: `ticket_replies`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | uuid | المعرف |
| ticket_id | uuid (FK -> support_tickets.id ON DELETE CASCADE) | التذكرة |
| author_id | uuid | كاتب الرد |
| message | text | نص الرد |
| created_at | timestamptz | تاريخ الإنشاء |

### سياسات الأمان (RLS)
- **الأدمن**: تحكم كامل (ALL)
- **المستخدم صاحب التذكرة**: قراءة + إضافة ردود على تذاكره فقط
- منع المستخدمين الموقوفين من الرد

## التغييرات المطلوبة

### 1. Hook جديد: `useTicketReplies.ts`
- `useTicketReplies(ticketId)` - جلب الردود مع اسم الكاتب
- `useCreateTicketReply()` - إنشاء رد جديد

### 2. مكون جديد: `TicketReplyThread.tsx`
- محادثة تشبه `DisputeResponseThread`
- عرض الردود بفقاعات: رسائل المستخدم الحالي على اليسار، الآخرين على اليمين (RTL)
- حقل إدخال + زر إرسال
- دعم المرفقات عبر `FileUploader` و `AttachmentList`

### 3. تعديل `AdminTicketDetail.tsx`
- إضافة مكون `TicketReplyThread` بعد وصف التذكرة
- عرض المرفقات الخاصة بالتذكرة

### 4. صفحة جديدة: `TicketDetail.tsx` (للمستخدم)
- عرض تفاصيل التذكرة (الموضوع، الحالة، الأولوية، الوصف)
- مكون `TicketReplyThread` للمحادثة مع الدعم
- المرفقات

### 5. تعديل `TicketCard.tsx`
- جعل البطاقة قابلة للنقر (تنقل لصفحة تفاصيل التذكرة)
- إضافة `id` و `onClick`/Link

### 6. تعديل `App.tsx`
- إضافة route: `/tickets/:id` -> `TicketDetail`

### 7. تعديل `SupportTickets.tsx`
- تمرير `id` لكل `TicketCard` وجعلها قابلة للنقر

## التفاصيل التقنية

### سير المحادثة
```text
المستخدم يفتح تذكرة
  |
  +-- الأدمن يرى التذكرة في /admin/tickets/:id
  +-- الأدمن يكتب رد -> يُحفظ في ticket_replies
  +-- المستخدم يرى الرد في /tickets/:id
  +-- المستخدم يرد -> يُحفظ في ticket_replies
  +-- (محادثة مستمرة حتى الإغلاق)
```

### الملفات المتأثرة
- **Migration**: جدول `ticket_replies` مع RLS
- **جديد**: `src/hooks/useTicketReplies.ts`
- **جديد**: `src/components/tickets/TicketReplyThread.tsx`
- **جديد**: `src/pages/TicketDetail.tsx` (صفحة المستخدم)
- **تعديل**: `src/pages/admin/AdminTicketDetail.tsx` - إضافة سجل المحادثة
- **تعديل**: `src/components/tickets/TicketCard.tsx` - جعلها قابلة للنقر
- **تعديل**: `src/pages/SupportTickets.tsx` - تمرير id
- **تعديل**: `src/App.tsx` - إضافة route جديد
