

## خطة محدّثة: إرسال إيميلات الإشعارات عبر SMTP من cPanel

### الفكرة
بدلاً من Resend API، نستخدم SMTP الخاص بسيرفر cPanel مباشرة. هذا يعني:
- لا حاجة لمفتاح Resend API
- الإيميلات تُرسل من بريدك الرسمي (مثل `notifications@yourdomain.com`)
- تحكم كامل من cPanel

### المتطلبات من عندك
ستحتاج إنشاء بريد إلكتروني من cPanel (مثل `notifications@yourdomain.com`) وتزويدنا بـ 4 معلومات:

| Secret | مثال | من وين تجيبه |
|---|---|---|
| `SMTP_HOST` | `mail.yourdomain.com` | cPanel → Email Accounts |
| `SMTP_PORT` | `465` | عادةً 465 (SSL) أو 587 (TLS) |
| `SMTP_USER` | `notifications@yourdomain.com` | البريد اللي أنشأته |
| `SMTP_PASS` | كلمة مرور البريد | نفس كلمة المرور اللي حطيتها |

### التعديلات التقنية

#### 1. Edge Function `send-notification-email`
- تستخدم مكتبة `denomailer` (SMTP client لـ Deno) لإرسال البريد فعلياً عبر SMTP
- تُستدعى من trigger على جدول `notifications`
- تتحقق من تفضيلات المستخدم قبل الإرسال

#### 2. DB Trigger على `notifications` AFTER INSERT
- يستدعي Edge Function عبر `pg_net` HTTP POST
- يمرر `notification_id` فقط

#### 3. تصنيف الإشعارات (مفعّل/معطّل افتراضياً)

**مفعّل افتراضياً (مهم):**
- `bid_accepted`, `bid_rejected`, `project_completed`, `project_cancelled`, `project_disputed`
- `contract_created`, `contract_signed`
- `escrow_released`, `escrow_refunded`
- `withdrawal_approved/rejected/processed`
- `service_approved`, `service_rejected`
- `bank_transfer_approved/rejected`
- `invoice_created`, `dispute_opened`

**معطّل افتراضياً (غير مهم / كثير التكرار):**
- `message_received`, `bid_received`, `escrow_created`
- `timelog_approved/rejected`, `project_in_progress`, `project_open`
- `service_purchased`, `deliverable_submitted`

#### 4. تحديث `notification-preferences.ts`
- إضافة `defaultEnabled: boolean` لكل نوع
- تعديل `isNotificationEnabled()` ليستخدم القيمة الافتراضية

#### 5. حذف Edge Functions القديمة
- `send-email` و `notify-deliverable` — لم تعد مطلوبة

### الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `supabase/functions/send-notification-email/index.ts` | Edge function جديدة (SMTP via denomailer) |
| DB Migration | Trigger على `notifications` + تفعيل `pg_net` |
| `src/lib/notification-preferences.ts` | `defaultEnabled` + تحديث `isNotificationEnabled` |
| `src/components/notifications/NotificationPreferences.tsx` | استخدام القيم الافتراضية الجديدة |
| `supabase/config.toml` | إضافة config للـ function الجديدة |
| حذف `supabase/functions/send-email/` | لم تعد مطلوبة |
| حذف `supabase/functions/notify-deliverable/` | لم تعد مطلوبة |

### الخطوة الأولى
قبل البدء بالتنفيذ، أحتاج منك:
1. إنشاء بريد من cPanel (مثل `notifications@yourdomain.com`)
2. تزويدي بـ: SMTP Host، Port، Username، Password

