

## تحويل شاشات تسجيل الدخول والتسجيل إلى نوافذ منبثقة (Modals)

### الملخص
بدلاً من فتح صفحة `/auth` منفصلة، ستظهر نماذج تسجيل الدخول والتسجيل كنوافذ منبثقة أنيقة فوق الصفحة الرئيسية. على الموبايل ستظهر كـ Bottom Sheet.

### التغييرات

**1. إنشاء مكون `AuthModal` جديد**
- ملف: `src/components/AuthModal.tsx`
- ينقل كامل منطق ونموذج تسجيل الدخول/التسجيل من `Auth.tsx` إلى هذا المكون
- يستخدم `Dialog` (من Radix) على الشاشات الكبيرة مع تأثير `backdrop-blur-md` على الخلفية
- يستخدم `Drawer` (من Vaul) على الموبايل كـ Bottom Sheet
- يستقبل props: `open`, `onOpenChange`, `defaultMode` (login/register)
- يحتوي على زر التبديل بين تسجيل الدخول والتسجيل داخل نفس النافذة
- يحتفظ بنفس التصميم الحالي (الحقول، الألوان، النصوص العربية)
- عند نجاح تسجيل الدخول يتم التوجيه إلى `/dashboard` وإغلاق النافذة

**2. تحديث الصفحة الرئيسية `Index.tsx`**
- إضافة state لإدارة فتح/إغلاق النافذة ونوعها (login/register)
- تحويل أزرار "تسجيل الدخول" و"إنشاء حساب" في Header من روابط `Link` إلى أزرار تفتح الـ Modal
- تحويل أزرار CTA و Hero ("ابدأ الآن"، "سجّل مجاناً") لتفتح الـ Modal بدلاً من التوجيه لصفحة `/auth`
- إضافة `AuthModal` component في أسفل الصفحة

**3. تحديث `Auth.tsx`**
- يبقى كـ fallback إذا وصل المستخدم مباشرة عبر URL `/auth`
- يعرض الـ Modal مفتوحاً تلقائياً مع إعادة توجيه للصفحة الرئيسية عند الإغلاق

### تفاصيل تقنية

**استخدام `useIsMobile` hook** الموجود لتحديد عرض Dialog أو Drawer:

```text
Desktop: Dialog مع DialogOverlay معدّل (backdrop-blur-md بدل bg-black/80)
Mobile:  Drawer (Bottom Sheet) مع نفس محتوى النموذج
```

**هيكل المكون:**

```text
AuthModal
  +-- useIsMobile()
  +-- if mobile -> Drawer + DrawerContent
  +-- if desktop -> Dialog + DialogContent (with glassmorphism overlay)
  +-- AuthForm (shared form content - login/register toggle, fields, validation)
```

**الملفات المتأثرة:**
- `src/components/AuthModal.tsx` -- جديد
- `src/pages/Index.tsx` -- تعديل الأزرار لتفتح Modal
- `src/pages/Auth.tsx` -- تبسيط ليستخدم AuthModal

