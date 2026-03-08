

## إصلاح مشكلة Authorization Header مع cPanel

### المشكلة
كود الـ PHP والـ Edge Function صحيحين والمفتاح متطابق. المشكلة الأرجح أن **Apache على cPanel يحذف الـ `Authorization` header** قبل ما يوصل لملف PHP. هذي مشكلة شائعة جداً في سيرفرات cPanel/Apache.

### الحل
تغيير طريقة إرسال المفتاح من `Authorization: Bearer ...` إلى header مخصص `X-API-Key` اللي ما يتأثر بإعدادات Apache.

**التعديلات المطلوبة:**

| # | الملف | التعديل |
|---|---|---|
| 1 | `supabase/functions/send-notification-email/index.ts` | إرسال المفتاح في `X-API-Key` header بدل `Authorization` |
| 2 | `send-email.php` (على السيرفر) | قراءة المفتاح من `X-API-Key` بدل `Authorization` |

**تعديل الـ Edge Function:**
```typescript
// قبل
headers: {
  "Authorization": `Bearer ${relayApiKey}`,
}

// بعد  
headers: {
  "X-API-Key": relayApiKey,
}
```

**تعديل PHP (تسويه أنت على السيرفر):**
```php
// بدل سطر التحقق الحالي:
$authHeader = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : (isset($_SERVER['HTTP_X_API_KEY']) ? $_SERVER['HTTP_X_API_KEY'] : '');

if ($authHeader !== $API_SECRET) {
```

بعد التعديلين، أعيد نشر الوظيفة وأختبر الإرسال فوراً.

