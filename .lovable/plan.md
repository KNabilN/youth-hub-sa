

# التحقق من نظام تذاكر الدعم وإصلاح المشاكل المكتشفة

## نتائج الفحص
النظام يعمل بشكل صحيح من ناحية البنية التحتية (الـ Trigger والـ RLS والـ Realtime). لكن تم اكتشاف مشكلتين:

### المشكلة 1: الأدمن يُوجَّه لصفحة المستخدم عند النقر على إشعار التذكرة
عند نقر الأدمن على إشعار رد تذكرة، يتم توجيهه إلى `/tickets/{id}` (صفحة المستخدم) بدلاً من `/admin/tickets/{id}` (صفحة الأدمن).

### المشكلة 2: نوع `ticket_reply` لا يملك أيقونة مخصصة
الإشعار يظهر بأيقونة الجرس العامة بدلاً من أيقونة مخصصة للتذاكر.

## الحل

| الملف | التغيير |
|---|---|
| `src/components/notifications/NotificationItem.tsx` | 1. إضافة `ticket_reply` للـ typeConfig بأيقونة وعنوان مناسب |
| `src/components/notifications/NotificationItem.tsx` | 2. تعديل `getEntityLink` ليتحقق من دور المستخدم (أدمن → `/admin/tickets/{id}`) |

### التفاصيل
- إضافة سطر في typeConfig: `ticket_reply: { icon: MessageCircle, label: "رد على تذكرة" }`
- تعديل دالة `getEntityLink` لتقبل معامل `isAdmin` وتوجه الأدمن للمسار الصحيح `/admin/tickets/{id}`
- يتم تحديد كون المستخدم أدمن عبر hook موجود أو التحقق من `user_roles`

