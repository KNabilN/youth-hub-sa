

# إصلاح صفحة إعادة تعيين كلمة المرور

## المشكلة
عند الضغط على رابط الاستعادة من البريد، يتم توجيه المستخدم لصفحة `/reset-password` لكنها تعرض "رابط منتهي أو غير صالح" بدلاً من نموذج تغيير كلمة المرور.

السبب التقني: هناك race condition — حدث `PASSWORD_RECOVERY` من `onAuthStateChange` قد يُطلق قبل mount الكومبوننت فيضيع، والفحص البديل `window.location.hash.includes("type=recovery")` لا يعمل مع إصدارات Supabase الحديثة التي تستخدم query params بدلاً من hash fragments.

## الحل في `src/pages/ResetPassword.tsx`

1. **فحص الجلسة الحالية عند التحميل**: بعد الضغط على رابط الاستعادة، Supabase يسجّل دخول المستخدم تلقائياً (implicit login). نفحص `getSession()` — إذا وُجدت جلسة نشطة، نعرض النموذج مباشرة.

2. **فحص URL search params**: إضافة فحص `window.location.search` بالإضافة للـ hash للتوافق مع كل إصدارات Supabase.

3. **زيادة المهلة**: رفعها من 5 ثوانٍ إلى 8 ثوانٍ لتغطية الشبكات البطيئة.

4. **الاستماع لحدث `SIGNED_IN` أيضاً**: الـ recovery flow في بعض الحالات يُطلق `SIGNED_IN` بدلاً من `PASSWORD_RECOVERY`.

### الملفات المتأثرة
- `src/pages/ResetPassword.tsx`

