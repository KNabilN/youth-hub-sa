

## مراجعة أمنية شاملة للمنصة

### ملخص تنفيذي

المنصة تتمتع ببنية أمنية جيدة بشكل عام (RLS policies, SECURITY DEFINER functions, role-based access, audit trails). لكن هناك **ثغرات حرجة وتحسينات مطلوبة** مرتبة حسب الخطورة:

---

### 🔴 ثغرات حرجة (يجب إصلاحها فوراً)

#### 1. تصعيد الصلاحيات عبر التسجيل (Privilege Escalation via Sign-Up)
**الملف:** `src/hooks/useAuth.tsx` سطر 60-70
**المشكلة:** دالة `signUp` تمرر الدور (`role`) في `user_metadata`، والتريجر `handle_new_user_role` يقرأ هذا الدور ويدخله في جدول `user_roles` مباشرة. يمكن لأي شخص إرسال طلب تسجيل مع `role: "super_admin"` عبر تعديل الطلب في المتصفح والحصول على صلاحيات المدير الكامل.

**الحل:** تعديل دالة `handle_new_user_role` لمنع تعيين دور `super_admin` تلقائياً:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _role app_role;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'youth_association')::app_role;
  IF _role = 'super_admin' THEN
    _role := 'youth_association';  -- منع التسجيل كمدير
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;
```

#### 2. إنشاء مستخدمين بدون Edge Function (Admin Create User Bypass)
**الملف:** `src/components/admin/AdminCreateUserDialog.tsx` سطر 73
**المشكلة:** يستخدم `supabase.auth.signUp()` من الـ client-side بدلاً من Edge Function مع `admin.createUser()`. هذا يعني أن المستخدم المنشأ يحتاج تأكيد بريد إلكتروني، والأهم أن عملية تحديث الـ profile (سطر 88) تتم بصلاحيات المستخدم المسجّل حالياً (الأدمن)، وليس المستخدم الجديد — وهذا يعمل فقط لأن سياسة "Admins can update all profiles" موجودة.

**الحل:** استخدام Edge Function `bulk-create-associations` الموجودة أصلاً أو إنشاء edge function مخصصة تستخدم `admin.createUser()` مع `email_confirm: true`.

#### 3. سياسة `user_roles` INSERT/DELETE مفتوحة
**المشكلة:** جدول `user_roles` ليس لديه سياسة INSERT/DELETE مقيّدة بشكل كافٍ. السياسة الوحيدة للكتابة هي "Admins can manage all roles" (FOR ALL). لكن لا توجد سياسة تمنع المستخدم العادي من إدراج صف جديد. يجب التحقق أن السياسات الافتراضية (restrictive) تمنع ذلك فعلاً.

**الحل:** إضافة تأكيد صريح:
```sql
-- تأكد أن فقط الأدمن يمكنه تعديل الأدوار
-- السياسات الحالية يجب أن تكون كافية لكن يجب التحقق
```

---

### 🟠 ثغرات متوسطة

#### 4. حقن HTML في قوالب البريد الإلكتروني (Email Template Injection)
**الملفات:** `supabase/functions/send-email/index.ts` سطر 41-43، `notify-deliverable/index.ts` سطر 33
**المشكلة:** القيم (`toName`, `message`, `project.title`) تُدرج مباشرة في HTML بدون تنقية (escaping). مهاجم يمكنه إدخال اسم مستخدم يحتوي على `<script>` أو HTML خبيث.

**الحل:** إضافة دالة escape HTML:
```typescript
function escapeHtml(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

#### 5. `moyasar-get-config` يستخدم `getUser()` بدلاً من `getClaims()`
**الملف:** `supabase/functions/moyasar-get-config/index.ts` سطر 29
**المشكلة:** `getUser()` يرسل طلب شبكة إضافي للتحقق من المستخدم بينما `getClaims()` يتحقق محلياً وهو أسرع وأكثر أماناً حسب معايير المنصة.

#### 6. `moyasar-verify-payment` يستخدم `getUser()` أيضاً
**الملف:** `supabase/functions/moyasar-verify-payment/index.ts` سطر 29
**نفس المشكلة أعلاه.**

#### 7. `notify-deliverable` يستخدم `getUser()` بدلاً من `getClaims()`
**الملف:** `supabase/functions/notify-deliverable/index.ts` سطر 78

---

### 🟡 تحسينات مقترحة

#### 8. CORS مفتوح (`*`) في جميع Edge Functions
جميع الـ Edge Functions تستخدم `Access-Control-Allow-Origin: *`. الأفضل تقييدها لنطاقات المنصة فقط (`youth-hub-sa.lovable.app` و preview URL).

#### 9. عدم وجود Rate Limiting على الـ Edge Functions
لا يوجد حماية من الاستخدام المفرط على مستوى الـ edge functions (خاصة `moyasar-verify-payment`).

#### 10. `dangerouslySetInnerHTML` في `chart.tsx`
مستخدم فقط لتوليد CSS themes — وهو آمن لأن البيانات ليست من المستخدم. لا حاجة لتغيير.

#### 11. عدم استخدام `encodeURIComponent` في أي مكان
لا توجد عناوين URL تُبنى من مدخلات المستخدم حالياً، لذا هذا ليس مشكلة فعلية الآن.

---

### ✅ نقاط قوة موجودة

| الجانب | الحالة |
|--------|--------|
| RLS على جميع الجداول | ✅ مفعّل |
| `SECURITY DEFINER` لفحص الأدوار | ✅ `has_role()`, `get_user_role()` |
| فصل الأدوار في جدول مستقل | ✅ `user_roles` |
| Audit trail كامل | ✅ `audit_log` + triggers |
| حماية المستخدمين المعلقين | ✅ `is_not_suspended()` |
| التحقق من المدخلات (Contact Form) | ✅ Zod + rate limiting |
| المفاتيح السرية في Edge Functions فقط | ✅ Moyasar keys server-side |
| كلمات المرور المسربة (Leaked Password) | ✅ مفعّل |
| PDPL consent tracking | ✅ موجود |
| عدم تخزين الأدوار في localStorage | ✅ لا يوجد |

---

### خطة الإصلاح المقترحة (مرتبة بالأولوية)

| # | المهمة | الخطورة | التغيير |
|---|--------|---------|---------|
| 1 | منع تسجيل `super_admin` عبر signup | 🔴 حرج | Migration: تعديل `handle_new_user_role` |
| 2 | تنقية HTML في قوالب البريد | 🟠 متوسط | تعديل 2 edge functions |
| 3 | استبدال `getUser()` بـ `getClaims()` | 🟠 متوسط | تعديل 3 edge functions |
| 4 | إصلاح `AdminCreateUserDialog` | 🟠 متوسط | استخدام edge function بدلاً من client signup |

هل تريد تنفيذ هذه الإصلاحات؟

