

# إزالة نظام طلبات التعديل بالكامل

الأدمن سيقوم بالتعديل المباشر على أي شيء دون الحاجة لإرسال طلبات تعديل للمستخدمين.

## الملفات التي سيتم تعديلها

### 1. إزالة رابط "طلبات التعديل" من القائمة الجانبية
**`src/components/AppSidebar.tsx`**
- حذف استيراد `usePendingEditRequestsCount`
- حذف متغير `pendingEditCount` و `showEditRequests`
- حذف عنصر القائمة "طلبات التعديل" بالكامل
- إبقاء "تذاكر الدعم" و "الملف الشخصي" كما هي (تحت قسم "عام") مع إظهارها لجميع الأدوار غير الأدمن

### 2. إزالة صفحة طلبات التعديل والمسار
**`src/App.tsx`**
- حذف استيراد `EditRequests` و المسار `/edit-requests`

### 3. إزالة تبويب "طلبات التعديل" من تفاصيل المستخدم (Admin)
**`src/pages/admin/AdminUserDetail.tsx`**
- حذف استيراد واستخدام `useAdminUserEditRequests`
- حذف تبويب "طلبات التعديل" وعرضه

**`src/components/admin/UserDetailSheet.tsx`**
- نفس التغييرات

### 4. ملفات يمكن حذفها (لم تعد مستخدمة)
- `src/pages/EditRequests.tsx`
- `src/components/edit-requests/EditRequestCard.tsx`
- `src/components/admin/EditRequestDialog.tsx`
- `src/hooks/useEditRequests.ts`

> ملاحظة: جدول `edit_requests` في قاعدة البيانات سيبقى كما هو (لا حذف بيانات). الأدمن يستخدم بالفعل `AdminDirectEditDialog` للتعديل المباشر.

