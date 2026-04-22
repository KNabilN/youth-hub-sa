

## مراسلة الأدمن للمستخدمين من "إدارة المستخدمين"

نظام محادثات مباشر بين الأدمن وأي مستخدم (مستقل عن محادثات الطلبات الحالية)، مع متابعة الردود من واجهة موحّدة.

### المخطّط العام

```text
[إدارة المستخدمين] —زر مراسلة على كل صف—▶ [نافذة محادثة مباشرة]
                                              │
                                              ▼
                              جدول admin_messages (Realtime)
                                              ▲
                                              │
[المستخدم] ◀— تبويب جديد "رسائل الإدارة" في صفحة /messages + إشعار
```

### قاعدة البيانات

**جدول جديد `admin_direct_messages`**
| العمود | النوع | ملاحظة |
|---|---|---|
| id | uuid PK | |
| user_id | uuid not null | الطرف الآخر (المستخدم غير الأدمن) — مفتاح المحادثة |
| sender_id | uuid not null | كاتب الرسالة (أدمن أو المستخدم نفسه) |
| content | text not null | |
| attachment_url / attachment_name | text nullable | مرفقات اختيارية |
| is_read | boolean default false | يقرأها الطرف المستلم |
| created_at | timestamptz default now() | |

**RLS (دون migrations لجداول محجوزة):**
- `SELECT`: `user_id = auth.uid()` أو `has_role(auth.uid(), 'super_admin')`
- `INSERT`: 
  - إذا كان المرسل أدمن → مسموح بأي `user_id`
  - وإلا: `sender_id = auth.uid() AND user_id = auth.uid()` (المستخدم يردّ على محادثته فقط)
  - `is_not_suspended(auth.uid())`
- `UPDATE`: لتحديث `is_read` فقط — `user_id = auth.uid() OR is super_admin`

**Realtime:** إضافة الجدول إلى `supabase_realtime`.

**Trigger للإشعارات:**
- عند INSERT يرسله الأدمن → استدعاء `send_notification_secure` للمستخدم بنوع `admin_message` ورابط `/messages?tab=admin&user=<sender_admin_id>` (من جانب المستخدم) أو ببساطة `/messages` مع تبويب `admin`
- عند INSERT يرسله المستخدم → إشعار لكل أدمن بنوع `admin_message_reply` (اختياري — أو فقط للأدمن صاحب آخر رسالة في المحادثة)

**إضافة label** في `src/lib/notification-type-labels.ts`:
- `admin_message` → "رسالة من الإدارة"
- `admin_message_reply` → "رد جديد على محادثة إدارية"

### الواجهة

**1. أيقونة "مراسلة" في `UserTable.tsx`**
- زر `<MessageSquare />` ضمن صف كل مستخدم بجانب أزرار الإجراءات
- النقر يفتح `AdminUserChatSheet` (Side-Sheet عرض ~480px)

**2. مكوّن جديد `src/components/admin/AdminUserChatSheet.tsx`**
- Header: صورة + اسم + رقم المستخدم + زر "فتح صفحة كاملة"
- جسم: قائمة فقّاعات رسائل (نفس تصميم `ChatThread`) مع تمييز رسائل الأدمن
- إدخال: نص + رفع مرفق (يستخدم نفس bucket `attachments` بمسار `admin-messages/<user_id>/...`)
- Realtime: subscribe على `admin_direct_messages` بفلتر `user_id=eq.<id>`
- Mark-as-read تلقائي عند فتح المحادثة

**3. صفحة إدارية كاملة `/admin/messages`**
- قائمة جانبية بكل المحادثات (مستخدم واحد = محادثة واحدة) مرتّبة بآخر رسالة
- شارة عدد الرسائل غير المقروءة لكل محادثة
- النقر يفتح نفس `AdminUserChatSheet` المضمّن
- إضافة رابط في `AppSidebar` للأدمن: "رسائل المستخدمين" مع badge للعدد الكلي غير المقروء
- هذا يحقق "متابعة الردود" المطلوبة

**4. تبويب جديد "الإدارة" في `src/pages/Messages.tsx`** (للمستخدم العادي)
- إضافة `TabsTrigger value="admin"` بجانب "الطلبات" و"استفسارات"
- يعرض رسائل الأدمن في قائمة محادثات (عادةً محادثة واحدة) مع نفس واجهة `ChatThread` المعدّلة لتعمل على `admin_direct_messages`
- عند وصول رسالة جديدة من الأدمن في الوقت الفعلي → badge أحمر + إشعار + سونر toast

**5. مؤشر عام في `NotificationBadge` / السايدبار**
- إضافة العداد إلى عداد الرسائل العام الموجود مسبقاً للمستخدم

### الـ Hooks الجديدة (`src/hooks/useAdminMessages.ts`)

- `useAdminConversations()` — للأدمن: قائمة كل المحادثات (group by user_id) مع آخر رسالة + unread count + بيانات profile للمستخدم
- `useAdminMessageThread(userId)` — للأدمن والمستخدم على حدّ سواء: رسائل محادثة واحدة + Realtime
- `useSendAdminMessage()` — INSERT
- `useMarkAdminMessagesRead(userId)` — UPDATE `is_read`
- `useUserAdminConversation()` — للمستخدم: محادثته الواحدة مع الإدارة + unread count

### الإشعارات والبريد
- يستفيد من Trigger موجود الذي يستدعي `send-notification-email` تلقائياً (لو مفعّل في `notification_preferences` للمستخدم)
- لا تغيير في edge functions

### الملفات

**جديدة:**
- `supabase/migrations/<ts>_admin_direct_messages.sql` — الجدول + RLS + Realtime + Trigger
- `src/hooks/useAdminMessages.ts`
- `src/components/admin/AdminUserChatSheet.tsx`
- `src/pages/admin/AdminMessages.tsx`

**معدّلة:**
- `src/components/admin/UserTable.tsx` — زر المراسلة في كل صف
- `src/pages/Messages.tsx` — تبويب "الإدارة" + قائمة محادثة + ChatThread معاد استخدامه/مُعمَّم
- `src/components/messages/ChatThread.tsx` — قبول source mode (`project` أو `admin`) أو فصله إلى مكوّن قابل لإعادة الاستخدام `BaseChatThread`
- `src/components/AppSidebar.tsx` — رابط "رسائل المستخدمين" للأدمن + badge
- `src/App.tsx` — مسار `/admin/messages` (داخل `AdminRoute`)
- `src/lib/notification-type-labels.ts` — تسميات الأنواع الجديدة

### نقاط مغطّاة
- ✅ زر مراسلة في "إدارة المستخدمين"
- ✅ أدمن يبدأ المحادثة مع أي مستخدم بدون الحاجة لمشروع مشترك
- ✅ متابعة الردود من صفحة موحّدة `/admin/messages` + من نفس الـ Sheet
- ✅ المستخدم يرى ويردّ من تبويب جديد في `/messages`
- ✅ إشعارات داخلية + بريد إلكتروني (عبر النظام الحالي)
- ✅ Realtime لكلا الطرفين
- ✅ Badges للرسائل غير المقروءة
- ✅ مرفقات
- ✅ RLS صارمة تمنع تجسس المستخدمين على بعضهم

### لا تأثير على
- محادثات الطلبات (`messages`) — منفصلة تماماً
- استفسارات الخدمات (`service_inquiries`)
- صلاحيات الجمعيات/المزودين/المتبرعين — لا يمكنهم بدء محادثة مع الأدمن من جانبهم (الأدمن هو من يبدأ؛ بمجرد وجود محادثة يمكنهم الردّ). إن أردت السماح للمستخدم ببدء محادثة جديدة مع الإدارة من تلقاء نفسه، أخبرني وسأضيف زر "مراسلة الإدارة" في صفحة الرسائل.

