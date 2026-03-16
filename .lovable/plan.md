# خطة تنفيذ ميزة "استفسار عن خدمة" — محادثة بين الجمعية ومقدم الخدمة

## المشكلة

عندما تريد جمعية شراء خدمة، قد تحتاج معلومات إضافية لكن لا يوجد حالياً أي وسيلة للتواصل مع مقدم الخدمة قبل الشراء.

## الحل المقترح

إنشاء نظام "استفسارات الخدمات" مستقل عن نظام رسائل المشاريع الحالي، لتجنب أي تعارض مع البنية القائمة.

---

## التغييرات المطلوبة

### 1. قاعدة البيانات — جدولان جديدان

`service_inquiries` (الخيط/المحادثة):


| العمود      | النوع                    | ملاحظة            |
| ----------- | ------------------------ | ----------------- |
| id          | uuid PK                  | &nbsp;            |
| service_id  | uuid FK → micro_services | الخدمة المعنية    |
| sender_id   | uuid FK → profiles       | الجمعية/المتسائل  |
| provider_id | uuid FK → profiles       | مقدم الخدمة       |
| status      | text                     | `open` / `closed` |
| created_at  | timestamptz              | &nbsp;            |
| updated_at  | timestamptz              | &nbsp;            |


- Unique constraint على `(service_id, sender_id)` — محادثة واحدة لكل جمعية لكل خدمة
- RLS: الطرفان (sender + provider) + الأدمن فقط

`service_inquiry_messages` (الرسائل):


| العمود          | النوع                       |
| --------------- | --------------------------- |
| id              | uuid PK                     |
| inquiry_id      | uuid FK → service_inquiries |
| sender_id       | uuid FK → profiles          |
| content         | text                        |
| attachment_url  | text nullable               |
| attachment_name | text nullable               |
| is_read         | boolean default false       |
| created_at      | timestamptz                 |


- RLS: طرفا الاستفسار + الأدمن
- Realtime مفعّل على الجدول

**Trigger**: إشعار تلقائي للمقدم عند إنشاء استفسار جديد، وإشعار للطرف الآخر عند كل رسالة جديدة.

### 2. الواجهة الأمامية

**زر "استفسار" في صفحة تفاصيل الخدمة** (`ServiceDetail.tsx`):

- يظهر للجمعيات والداعمين المسجلين فقط (لا يظهر لمقدم الخدمة نفسه أو الزوار)
- عند الضغط → يفتح Sheet/Drawer جانبي يحتوي نافذة محادثة مصغرة
- إذا لم يوجد استفسار سابق، يُنشئ تلقائياً عند إرسال أول رسالة

**مكونات جديدة**:

- `src/components/services/ServiceInquirySheet.tsx` — Sheet يحتوي المحادثة
- `src/components/services/ServiceInquiryChat.tsx` — إعادة استخدام نمط `ChatThread` مع تعديل بسيط (inquiry بدل project)

**Hook جديد**:

- `src/hooks/useServiceInquiry.ts`:
  - `useServiceInquiry(serviceId)` — جلب/إنشاء الاستفسار
  - `useInquiryMessages(inquiryId)` — جلب الرسائل + realtime
  - `useSendInquiryMessage()` — إرسال رسالة
  - `useMarkInquiryRead()` — تعليم كمقروء

**تكامل مع صفحة الرسائل** (`Messages.tsx`):

- إضافة تبويب ثانٍ "استفسارات الخدمات" بجوار "محادثات المشاريع" في ConversationList
- أو دمج استفسارات الخدمات في نفس القائمة مع badge مميز (مثل: 🏷 استفسار خدمة)

**إشعارات**:

- `inquiry_created` — إشعار للمقدم عند فتح استفسار جديد
- `inquiry_message` — إشعار للطرف الآخر عند كل رسالة

### 3. ملخص الملفات


| الملف                                             | العملية                                          |
| ------------------------------------------------- | ------------------------------------------------ |
| هجرة SQL                                          | إنشاء الجدولين + RLS + triggers + realtime       |
| `src/hooks/useServiceInquiry.ts`                  | إنشاء جديد                                       |
| `src/components/services/ServiceInquirySheet.tsx` | إنشاء جديد                                       |
| `src/components/services/ServiceInquiryChat.tsx`  | إنشاء جديد                                       |
| `src/pages/ServiceDetail.tsx`                     | إضافة زر الاستفسار + Sheet                       |
| `src/pages/Messages.tsx`                          | دمج استفسارات الخدمات في قائمة المحادثات         |
| `src/hooks/useMessages.ts`                        | توسيع `useConversations` لتشمل استفسارات الخدمات |
| `src/lib/notification-preferences.ts`             | إضافة أنواع الإشعارات الجديدة                    |


### 4. اعتبارات الأداء

- Realtime مفلتر بـ `inquiry_id` لتقليل الحمل
- Lazy loading للـ Sheet (لا يُحمّل حتى يُفتح)
- استعلام واحد مجمع في `useConversations` لدمج المحادثتين

&nbsp;

بعد الانتهاء يرجى مراجعة توافق كل شيء مع النظام القائم وأنها تعمل بسلاسة عالية