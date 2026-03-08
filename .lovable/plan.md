

## إصلاح: أسماء أنواع الإشعارات تظهر بالإنجليزية بدلاً من العربية

### المشكلة
عند عدم وجود نوع الإشعار في قاموس الترجمة، يتم عرض المفتاح الإنجليزي الخام (مثل `payment`, `invoice_created`). يحدث هذا في:
1. **`NotificationItem.tsx`** سطر 105: `typeConfig[type] || { icon: Bell, label: type }` — الـ fallback يعرض `type` الخام
2. **`AdminNotifications.tsx`** سطر 175: `typeLabels[n.type] || n.type` — نفس المشكلة

### الأنواع الناقصة
بمقارنة triggers قاعدة البيانات مع القواميس الموجودة، هذه الأنواع غير مُعرّفة:

**في AdminNotifications.tsx فقط:**
- `service_suspended`, `escrow_frozen`, `dispute_resolved`, `timelog_submitted`, `bid_comment`, `invoice_created`, `grant_request_received`, `grant_request_approved`, `grant_request_rejected`, `grant_request_funded`, `project_suspended`

**في كلا الملفين:**
- `bank_transfer_pending`, `bank_transfer_approved`, `bank_transfer_rejected`, `donation_received`, `contact_message`

### الحل
1. **إنشاء ملف مركزي** `src/lib/notification-type-labels.ts` يحتوي على قاموس واحد شامل لكل أنواع الإشعارات مع ترجماتها العربية
2. **تحديث `NotificationItem.tsx`** — استيراد القاموس واستخدامه في الـ fallback بدلاً من `type` الخام
3. **تحديث `AdminNotifications.tsx`** — استيراد نفس القاموس بدلاً من `typeLabels` المحلي

### الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `src/lib/notification-type-labels.ts` | **جديد** — قاموس مركزي لكل أنواع الإشعارات |
| `src/components/notifications/NotificationItem.tsx` | استيراد القاموس واستخدامه كـ fallback label |
| `src/pages/admin/AdminNotifications.tsx` | استبدال `typeLabels` المحلي بالقاموس المركزي |

