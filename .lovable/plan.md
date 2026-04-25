
## السلوك المطلوب (مُحدّث)
- في صندوق محادثة الجمعية ومزود الخدمة:
  - **Enter** ⇒ يُرسل الرسالة.
  - **Shift + Enter** ⇒ ينزل سطراً جديداً.

(هذا هو السلوك القياسي في تطبيقات المحادثة مثل واتساب وسلاك.)

## الملف المعدّل
- `src/components/messages/ChatThread.tsx` فقط — صندوق محادثة الطلبات بين الجمعية ومزود الخدمة.

## التغييرات التقنية
1. استبدال `<Input>` بـ `<Textarea>` (لدعم الأسطر المتعددة + تمدد بسيط).
2. إضافة `onKeyDown`:
   - `Enter` بدون Shift ⇒ `e.preventDefault()` + `handleSend()`.
   - `Shift+Enter` ⇒ السلوك الافتراضي (سطر جديد).
3. الحفاظ على `<form onSubmit>` وزر الإرسال كما هو.

```tsx
<Textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }}
  placeholder="اكتب رسالتك... (Shift+Enter لسطر جديد)"
  className="flex-1 min-h-[44px] max-h-32 resize-none"
  rows={1}
  disabled={sendMessage.isPending}
/>
```

## بدون تأثير
- لا تغيير في قاعدة البيانات أو الـ hooks.
- لا تغيير على صناديق المحادثة الأخرى (الإدارة / استفسارات الخدمات / تعليقات العروض). يمكن تعميم نفس السلوك لاحقاً عند الطلب.
