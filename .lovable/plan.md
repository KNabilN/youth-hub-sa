

# ترجمة جميع رسائل الأخطاء إلى العربية

## المشكلة
عند فشل تسجيل الدخول أو التسجيل أو إعادة تعيين كلمة المرور، يتم عرض رسائل Supabase الإنجليزية مباشرة (مثل "Email not confirmed"، "Invalid login credentials"). هذا يتعارض مع سياسة المنصة بأن تكون عربية بالكامل.

## الحل
إنشاء دالة مركزية `translateAuthError` تحوّل رسائل الأخطاء الشائعة من Supabase إلى عربي، واستخدامها في جميع الأماكن التي تعرض `error.message` مباشرة.

## الملفات المتأثرة

### 1. `src/lib/auth-errors.ts` — ملف جديد
قاموس ترجمة لجميع رسائل Supabase Auth الشائعة:
- "Email not confirmed" → "لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من بريدك."
- "Invalid login credentials" → "بيانات الدخول غير صحيحة"
- "User already registered" → "البريد الإلكتروني مسجل مسبقاً"
- "Password should be at least 6 characters" → "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
- وغيرها...

### 2. `src/components/AuthModal.tsx` — سطران (126، 148)
استبدال `toast.error(error.message)` بـ `toast.error(translateAuthError(error.message))`

### 3. `src/pages/ForgotPassword.tsx` — سطر (23)
نفس التعديل

### 4. `src/pages/ResetPassword.tsx` — سطر (67)
نفس التعديل

### 5. `src/components/admin/AdminCreateUserDialog.tsx` — سطر (98)
استبدال `err.message` بالترجمة

### 6. `src/pages/MyDisputes.tsx` — سطر (97)
استبدال `err.message` بالترجمة

### 7. `src/hooks/useAttachments.ts` — سطر (112)
### 8. `src/hooks/useDeliverables.ts` — سطر (77)

## حجم التغييرات
- ملف جديد واحد (~30 سطر)
- تعديل 7 ملفات (إضافة import + استبدال error.message)

