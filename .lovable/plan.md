

# فتح الصورة الشخصية عند النقر عليها

## الوصف
عند النقر على صورة المستخدم (Avatar) في صفحة تفاصيل المستخدم الإدارية وصفحة الملف الشخصي العام، يتم فتح الصورة بحجم كبير في نافذة Dialog.

## التغييرات

### 1. إنشاء مكون `ImageLightbox`
ملف جديد `src/components/ui/image-lightbox.tsx` — مكون Dialog بسيط يعرض صورة بالحجم الكامل عند فتحه، مع زر إغلاق.

### 2. تحديث `src/pages/admin/AdminUserDetail.tsx`
- إضافة state للتحكم بفتح/إغلاق الـ lightbox
- جعل الـ Avatar قابل للنقر (cursor-pointer) عند وجود `avatar_url`
- عند النقر، فتح الصورة في الـ lightbox

### 3. تحديث `src/pages/PublicProfile.tsx`
- نفس المنطق: Avatar قابل للنقر يفتح الصورة في lightbox

