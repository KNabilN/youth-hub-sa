

# تفضيلات الإشعارات حسب الدور - إشعارات البريد الإلكتروني التفصيلية

## ملخص
استبدال مفتاح التبديل الحالي (إشعارات البريد الإلكتروني: تشغيل/إيقاف) بنظام تفضيلات تفصيلي يسمح لكل مستخدم باختيار أنواع الإشعارات التي يريد استلامها عبر البريد الإلكتروني، مع عرض الأنواع المناسبة لكل دور فقط.

---

## 1. تغييرات قاعدة البيانات

إضافة عمود `notification_preferences` من نوع JSONB لجدول `profiles`:

```sql
ALTER TABLE profiles
  ADD COLUMN notification_preferences jsonb DEFAULT '{}'::jsonb;
```

البنية المتوقعة للـ JSON:
```json
{
  "bid_accepted": true,
  "contract_signed": false,
  "escrow_released": true,
  ...
}
```
القيمة الافتراضية `{}` تعني "كل شيء مفعّل" - عدم وجود مفتاح يعني أنه مفعّل بشكل افتراضي. فقط عند تعيين `false` صراحةً يتم إيقاف الإشعار.

---

## 2. تعريف أنواع الإشعارات حسب الدور

### مقدم الخدمة (service_provider)
| المجموعة | النوع | الوصف بالعربي |
|---|---|---|
| العروض والمشاريع | `bid_accepted` | قبول عرض السعر |
| | `bid_rejected` | رفض عرض السعر |
| | `project_in_progress` | بدء العمل على مشروع |
| | `project_completed` | إكمال المشروع |
| | `project_cancelled` | إلغاء المشروع |
| | `project_disputed` | فتح نزاع |
| العقود | `contract_created` | إنشاء عقد جديد |
| | `contract_signed` | توقيع عقد |
| المالية | `escrow_created` | إنشاء ضمان مالي |
| | `escrow_released` | تحرير ضمان مالي |
| | `escrow_refunded` | استرداد ضمان مالي |
| | `withdrawal_approved` | الموافقة على طلب سحب |
| | `withdrawal_rejected` | رفض طلب سحب |
| | `withdrawal_processed` | تحويل مبلغ السحب |
| الخدمات | `service_approved` | الموافقة على خدمة |
| | `service_rejected` | رفض خدمة |
| | `service_purchased` | شراء خدمة |
| سجل الوقت | `timelog_approved` | الموافقة على سجل الوقت |
| | `timelog_rejected` | رفض سجل الوقت |
| التواصل | `message_received` | رسالة جديدة |

### الجمعية (youth_association)
| المجموعة | النوع | الوصف بالعربي |
|---|---|---|
| العروض والمشاريع | `bid_received` | استلام عرض سعر جديد |
| | `project_open` | الموافقة على المشروع |
| | `project_in_progress` | بدء العمل |
| | `project_completed` | إكمال المشروع |
| | `project_cancelled` | إلغاء المشروع |
| | `project_disputed` | فتح نزاع |
| العقود | `contract_created` | إنشاء عقد |
| | `contract_signed` | توقيع عقد |
| المالية | `escrow_created` | إنشاء ضمان مالي |
| | `escrow_released` | تحرير ضمان |
| | `escrow_refunded` | استرداد ضمان |
| | `bank_transfer_approved` | الموافقة على تحويل بنكي |
| | `bank_transfer_rejected` | رفض تحويل بنكي |
| التواصل | `message_received` | رسالة جديدة |

### المانح (donor)
| المجموعة | النوع | الوصف بالعربي |
|---|---|---|
| التبرعات | `donation_received` | تأكيد استلام تبرع |
| | `project_completed` | إكمال مشروع مدعوم |

### المدير (super_admin)
| المجموعة | النوع | الوصف بالعربي |
|---|---|---|
| الإدارة | `bank_transfer_pending` | تحويل بنكي جديد بانتظار المراجعة |
| | `dispute_opened` | نزاع جديد |

---

## 3. ملف تعريف التفضيلات (ملف جديد)

إنشاء `src/lib/notification-preferences.ts`:

يحتوي على:
- تعريف المجموعات والأنواع لكل دور (البيانات أعلاه)
- دالة `isNotificationEnabled(preferences, type)` - ترجع `true` إذا لم يكن المفتاح موجوداً (مفعّل افتراضياً)
- دالة `getPreferencesForRole(role)` - ترجع المجموعات والأنواع المناسبة للدور

---

## 4. مكوّن تفضيلات الإشعارات (مكوّن جديد)

إنشاء `src/components/notifications/NotificationPreferences.tsx`:

- يستبدل قسم "إعدادات الإشعارات" الحالي في Profile.tsx
- يعرض المجموعات كبطاقات فرعية مع عناوين ملونة
- كل نوع إشعار له مفتاح تبديل (Switch) مع وصف عربي
- زر "تفعيل الكل" و "إيقاف الكل" في أعلى القسم
- مفتاح التبديل الرئيسي "إشعارات البريد الإلكتروني" يبقى كمفتاح عام - إيقافه يعطّل جميع الإشعارات بغض النظر عن التفضيلات التفصيلية
- التصميم: كل مجموعة في `div` بخلفية خفيفة `bg-muted/30` مع حدود مستديرة، والمفاتيح بمحاذاة يسارية (RTL)

---

## 5. تعديل صفحة الملف الشخصي (Profile.tsx)

- استبدال قسم الإشعارات الحالي (السطور 584-600) بالمكوّن الجديد `NotificationPreferences`
- إضافة state `notificationPreferences` (JSONB object)
- تحميل القيم من `profile.notification_preferences` عند التهيئة
- إضافة `notification_preferences` لبيانات `handleSave`

---

## 6. تعديل handleSave (Profile.tsx)

إضافة حقل `notification_preferences` للكائن المُرسل:
```typescript
notification_preferences: notificationPreferences,
```

---

## الملفات المتأثرة

| الملف | التغيير |
|---|---|
| Migration SQL | إضافة عمود `notification_preferences` JSONB |
| `src/lib/notification-preferences.ts` | ملف جديد - تعريف الأنواع والمجموعات |
| `src/components/notifications/NotificationPreferences.tsx` | مكوّن جديد - واجهة التفضيلات |
| `src/pages/Profile.tsx` | استبدال قسم الإشعارات + إضافة state + تحديث handleSave |

---

## التصميم المتوقع

```text
+--------------------------------------------------+
| [BellRing] إعدادات الإشعارات                      |
+--------------------------------------------------+
| إشعارات البريد الإلكتروني          [====تشغيل====]|
| استلام إشعارات عبر البريد الإلكتروني              |
+--------------------------------------------------+
|                      [تفعيل الكل] [إيقاف الكل]    |
|                                                    |
| --- العروض والمشاريع ---                          |
| [x] قبول عرض السعر                                |
| [x] رفض عرض السعر                                |
| [x] بدء العمل على مشروع                           |
| [ ] إكمال المشروع                                 |
|                                                    |
| --- العقود ---                                    |
| [x] إنشاء عقد جديد                               |
| [x] توقيع عقد                                    |
|                                                    |
| --- المالية ---                                   |
| [x] إنشاء ضمان مالي                              |
| [x] تحرير ضمان مالي                              |
| ...                                               |
+--------------------------------------------------+
```

- التفضيلات التفصيلية تظهر فقط عندما يكون المفتاح الرئيسي مفعّلاً
- كل مجموعة في بطاقة فرعية بخلفية `bg-muted/30`
- تأثير انتقالي عند تفعيل/إيقاف المفتاح الرئيسي

