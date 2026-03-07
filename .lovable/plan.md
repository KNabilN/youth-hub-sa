

## خطة: إضافة إشعار تلقائي عند إصدار فاتورة لمزود الخدمة

### الوضع الحالي
- الفواتير **تُصدر بالفعل** لمزود الخدمة عند تحرير الضمان (سواء من إتمام المشروع أو من لوحة الأدمن)
- الفواتير **تظهر** في صفحة `/invoices` وفي شارة الشريط الجانبي
- **لا يوجد إشعار** يُرسل لمزود الخدمة عند إصدار الفاتورة — لذلك لا يعرف إن في فاتورة جديدة إلا إذا دخل الصفحة

### الحل
إضافة **trigger على جدول `invoices`** يُرسل إشعاراً تلقائياً للمستخدم (`issued_to`) عند إنشاء فاتورة جديدة.

### التعديلات

#### 1. Migration: إنشاء trigger `notify_on_invoice_create`
```sql
CREATE OR REPLACE FUNCTION public.notify_on_invoice_create()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
  VALUES (
    NEW.issued_to,
    'تم إصدار فاتورة جديدة رقم ' || NEW.invoice_number || ' بمبلغ ' || NEW.amount || ' ر.س',
    'invoice_created',
    NEW.id,
    'invoice'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_invoice_create
AFTER INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.notify_on_invoice_create();
```

#### 2. `NotificationItem.tsx` — إضافة نوع `invoice`
- إضافة `invoice_created` في `typeConfig` بأيقونة `Receipt`
- إضافة `case "invoice"` في `getEntityLink` → `/invoices`

### الملفات المتأثرة

| الملف | التعديل |
|---|---|
| DB Migration | إنشاء trigger `notify_on_invoice_create` |
| `src/components/notifications/NotificationItem.tsx` | إضافة نوع الإشعار وربط التنقل |

