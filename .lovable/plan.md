# تنظيف بيانات التجريب واستعداد للمستخدمين الحقيقيين

## الوضع الحالي في قاعدة البيانات


| الجدول                                              | العدد                                     | القرار                         |
| --------------------------------------------------- | ----------------------------------------- | ------------------------------ |
| profiles + user_roles                               | 90 (71 جمعية + 14 مزود + 4 مانح + 1 أدمن) | **يبقى**                       |
| micro_services                                      | 60                                        | **يبقى**                       |
| categories, regions, cities                         | بيانات مرجعية                             | **يبقى**                       |
| commission_config                                   | إعدادات                                   | **يبقى**                       |
| site_content                                        | محتوى الموقع                              | **يبقى**                       |
| projects                                            | 27                                        | **يُحذف**                      |
| bids + bid_comments                                 | 25                                        | **يُحذف**                      |
| contracts + contract_versions                       | 17                                        | **يُحذف**                      |
| escrow_transactions                                 | 40                                        | **يُحذف**                      |
| invoices                                            | 32                                        | **يُحذف**                      |
| bank_transfers                                      | 4                                         | **يُحذف**                      |
| withdrawal_requests                                 | 23                                        | **يُحذف**                      |
| donor_contributions                                 | 22                                        | **يُحذف**                      |
| grant_requests                                      | 7                                         | **يُحذف**                      |
| disputes + dispute_responses + dispute_status_log   | 4                                         | **يُحذف**                      |
| ratings                                             | 6                                         | **يُحذف**                      |
| messages                                            | 8                                         | **يُحذف**                      |
| notifications                                       | 464                                       | **يُحذف**                      |
| support_tickets + ticket_replies                    | 7                                         | **يُحذف**                      |
| time_logs                                           | 14                                        | **يُحذف**                      |
| cart_items                                          | 6                                         | **يُحذف**                      |
| audit_log                                           | 1174                                      | **يُحذف**                      |
| attachments                                         | 5                                         | **يُحذف**                      |
| portfolio_items                                     | 3                                         | **يبقى** (مرتبط بمزودي الخدمة) |
| contact_messages, pending_categories, edit_requests | بيانات تجريبية                            | **يُحذف**                      |


## خطة التنفيذ

تشغيل migration واحد يحذف البيانات التجريبية بالترتيب الصحيح (الجداول الفرعية أولاً ثم الرئيسية) مع الحفاظ على:

- **الجمعيات والمستخدمين** (profiles + user_roles)
- **الخدمات** (micro_services)
- **البيانات المرجعية** (categories, regions, cities, commission_config, site_content)
- **الملفات الشخصية والبورتفوليو** (portfolio_items)

### ترتيب الحذف (لتجنب مشاكل Foreign Keys)

1. bid_comments → bids
2. dispute_responses, dispute_status_log → disputes
3. contract_versions → contracts
4. ticket_replies → support_tickets
5. project_deliverables, time_logs, messages
6. invoices, bank_transfers, withdrawal_requests
7. escrow_transactions
8. donor_contributions, grant_requests, impact_reports
9. projects
10. notifications, audit_log, cart_items, attachments, contact_messages, edit_requests, pending_categories, profile_saves

### ملفات لن تتغير

لا يوجد أي تغيير في الكود — فقط تنظيف بيانات في قاعدة البيانات.

تأكد أن صفحة الفرضيات تبقى دون اي تغيير، إلا الناتج عن تغيير الداتا المرتبطة بها