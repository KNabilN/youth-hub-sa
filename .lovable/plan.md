

# حذف طلبات الجمعيات وتذاكر الدعم

## ما سيتم حذفه

| الجدول | عدد السجلات | الوصف |
|---|---|---|
| `ticket_replies` | 5 | ردود التذاكر |
| `support_tickets` | 9 | تذاكر الدعم |
| `dispute_responses` | 0 | ردود الشكاوى |
| `dispute_status_log` | 0 | سجل حالات الشكاوى |
| `disputes` | 1 | الشكاوى |
| `attachments` | 1 | المرفقات |
| `project_deliverables` | 0 | التسليمات |
| `bids` | 9 | العروض المقدمة |
| `contracts` | 9 | العقود |
| `projects` | 12 | طلبات الجمعيات |

## ما سيتم الحفاظ عليه
- بيانات المستخدمين والملفات الشخصية
- الخدمات المقدمة (micro_services)
- التصنيفات والمناطق والمدن
- أكواد الخصم وطلبات المنح

## ترتيب الحذف (بسبب العلاقات بين الجداول)
1. `DELETE FROM ticket_replies` — ردود التذاكر أولاً
2. `DELETE FROM support_tickets` — ثم التذاكر
3. `DELETE FROM dispute_responses` — ردود الشكاوى
4. `DELETE FROM dispute_status_log` — سجل الشكاوى
5. `DELETE FROM disputes` — الشكاوى
6. `DELETE FROM attachments` — المرفقات
7. `DELETE FROM project_deliverables` — التسليمات
8. `DELETE FROM time_logs` — سجلات الوقت
9. `DELETE FROM bids` — العروض
10. `DELETE FROM contracts` — العقود
11. `DELETE FROM projects` — طلبات الجمعيات

