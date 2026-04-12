

# تنظيف البيانات المالية التجريبية

## ما سيتم حذفه
| الجدول | عدد السجلات | الوصف |
|---|---|---|
| `escrow_transactions` | 18 | جميع معاملات الضمان المالي |
| `invoices` | 12 | جميع الفواتير الصادرة |
| `bank_transfers` | 3 | سجلات التحويلات البنكية |
| `withdrawal_requests` | 0 | طلبات السحب (فارغ حالياً) |
| `donor_contributions` | 15 | سجلات مساهمات المانحين |
| `cart_items` | 11 | عناصر السلة المعلقة |

## ما سيتم الحفاظ عليه
- بيانات المستخدمين (profiles, user_roles)
- الطلبات/المشاريع (projects)
- الخدمات المقدمة (micro_services)
- التصنيفات والمناطق والمدن
- أكواد الخصم (discount_codes)
- طلبات المنح (grant_requests)
- العقود (contracts) والعروض (bids)

## ملاحظة
- الحذف سيتم عبر أداة إدراج البيانات (DELETE statements)
- ترتيب الحذف مهم بسبب العلاقات بين الجداول: الفواتير أولاً → التحويلات البنكية → طلبات السحب → مساهمات المانحين → معاملات الضمان → السلة

## التفاصيل التقنية
سيتم تنفيذ أوامر DELETE بالترتيب التالي:
1. `DELETE FROM invoices`
2. `DELETE FROM bank_transfers`
3. `DELETE FROM withdrawal_requests`
4. `DELETE FROM donor_contributions`
5. `DELETE FROM cart_items`
6. `DELETE FROM escrow_transactions`

