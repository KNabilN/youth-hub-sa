# حل مشكلة ظهور صفحة "404" في نتائج جوجل

## تشخيص المشكلة

نتيجة البحث في جوجل تعرض صفحة بعنوان "404" تابعة لـ `sharedservices.solutions`. هذا ليس عطلاً في الموقع — جميع الروابط تعمل وتُرجع `HTTP 200`. المشكلة أن جوجل فهرس مسبقاً رابطاً غير موجود (مثلاً رابط قديم أو رابط خارجي مكسور)، وعندما زاره عرضت له صفحة `NotFound.tsx` التي تحتوي نص "404"، فاستخدم ذلك كعنوان في نتائج البحث.

السبب الجذري: صفحة الـ NotFound لا تحمل وسم `noindex`، ولا يوجد `sitemap.xml` يوجّه جوجل للصفحات الصحيحة.

## الخطة

### 1. منع فهرسة صفحة NotFound
- تعديل `src/pages/NotFound.tsx` لإضافة `<meta name="robots" content="noindex, nofollow">` و `<title>` واضح، باستخدام `useEffect` لحقن الوسوم في `<head>` (المشروع لا يستخدم react-helmet).
- تغيير عنوان الصفحة من "404" المجرد إلى عنوان وصفي مثل "الصفحة غير موجودة - منصة الخدمات المشتركة" حتى لو ظهرت في النتائج لا تبدو ككيان مكسور.

### 2. إضافة sitemap.xml
- إنشاء `public/sitemap.xml` يحتوي روابط الصفحات العامة فقط:
  - `/` (الرئيسية)
  - `/about`
  - `/faq`
  - `/privacy`
  - `/marketplace` يتطلب تسجيل دخول، لذا لن يُدرج
  - الصفحات العامة فقط (تلك التي تحت `PublicLayout`)

### 3. تحديث robots.txt
- إضافة سطر `Sitemap: https://sharedservices.solutions/sitemap.xml` في نهاية الملف ليرشد جوجل للسايت ماب.
- إضافة `Disallow` للمسارات المحمية مثل `/dashboard`, `/admin`, `/auth` لمنع محاولات فهرستها (تعود بصفحة فارغة أو NotFound).

### 4. توحيد العنوان والـ canonical للصفحة الرئيسية
- التأكد أن `index.html` يحتوي `<title>` و `<meta name="description">` قويان حتى لا يلتقط جوجل نص NotFound مرة أخرى.
- إضافة `<link rel="canonical" href="https://sharedservices.solutions/">` في `index.html`.

## ماذا يحدث بعد التطبيق

- بعد النشر، يحتاج جوجل من أيام إلى أسابيع لإعادة الزحف وإزالة نتيجة "404" من الفهرس تلقائياً (الآن الصفحة تحمل `noindex`).
- يمكن تسريع الإزالة من خلال أداة "Removals" في Google Search Console (يدوياً من قِبَلكم).

## الملفات المتأثرة

- `src/pages/NotFound.tsx` — إضافة noindex + عنوان وصفي
- `public/robots.txt` — إضافة Sitemap و Disallow للمسارات الخاصة
- `public/sitemap.xml` — جديد
- `index.html` — تأكيد title/description/canonical
