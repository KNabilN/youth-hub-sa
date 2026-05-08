## الهدف
عند تعديل الجهة (الجمعية/مزوّد الخدمة) لملفها الشخصي، لا يتم تطبيق التغيير مباشرةً على الحساب، بل يُحفظ كـ **طلب تعديل قيد المراجعة** يراه الـ Super Admin مع مقارنة (القيم القديمة ↔ القيم الجديدة)، ويوافق أو يرفض. الحساب نفسه يبقى **موثقاً وغير معلّق** كما هو، ولا يتغيّر شيء في الواجهات العامة حتى الموافقة.

ملاحظة: هذا التغيير يخص **الملف الشخصي فقط**. الخدمات وطلبات الجمعية تستخدم بالفعل آلية "قيد المراجعة"، فلن نمسّها.

## الحقول الحساسة التي تتطلب موافقة
سنحدد قائمة "حقول حساسة" تستلزم مراجعة، باقي الحقول تُحدَّث مباشرةً (لتفادي إغراق الأدمن):
- `full_name`, `organization_name`, `license_number`
- `contact_officer_name`, `contact_officer_email`, `contact_officer_phone`, `contact_officer_title`
- `region_id`, `city_id`
- `bio` (اختياري — قابل للنقاش)

الحقول غير الحساسة (تطبَّق فوراً): `phone` (الهاتف الشخصي)، التفضيلات، المهارات، المؤهلات، الصور، البيانات البنكية.

## قاعدة البيانات
سنستخدم جدول `edit_requests` الموجود (لم يُستخدم في الكود حالياً). نضيف:
1. **تعديل بنية بسيطة** على `edit_requests`:
   - عمود `old_values jsonb` لتسجيل القيم القديمة (ييسر العرض في لوحة الأدمن).
   - عمود `reviewed_by uuid` و `reviewed_at timestamptz` و `admin_note text`.
   - فهرس على `(target_user_id, status)` و `(status, created_at)`.
2. **سياسات RLS**:
   - المستخدم: ينشئ ويرى طلباته (موجود بالفعل لـ SELECT/UPDATE، نضيف INSERT بشرط `requested_by = auth.uid() AND target_user_id = auth.uid()`).
   - الأدمن: إدارة الكل (موجود).
3. **دالة آمنة `apply_edit_request(request_id uuid)`** بنوع `SECURITY DEFINER`:
   - تتحقق أن المستدعي super_admin.
   - تطبّق `requested_changes` على `profiles` للمستخدم المستهدف.
   - تحدّث الطلب: `status = 'approved'`, `reviewed_by`, `reviewed_at`.
   - تنشئ إشعاراً للمستخدم بقبول التعديلات.
4. **دالة `reject_edit_request(request_id uuid, note text)`** مماثلة للرفض + إشعار بالسبب.

> لن نلمس أعمدة الحساب مثل `is_verified` أو `is_suspended`.

## التغييرات في الواجهة (Frontend)

### 1) `src/hooks/useProfile.ts` — `useUpdateProfile`
- استقبال `updates` كاملة + قائمة الحقول الحساسة.
- تقسيم التحديث إلى:
  - `instantUpdates`: تطبَّق مباشرة على `profiles`.
  - `pendingUpdates`: إن وُجدت، تُقرأ القيم القديمة من الـ profile الحالي وتُدرج صفّاً واحداً في `edit_requests`:
    ```
    target_table='profiles', target_id=user.id, target_user_id=user.id,
    requested_by=user.id, requested_changes={...}, old_values={...}, status='pending'
    ```
  - منع إنشاء طلب مكرّر مفتوح: إن وُجد طلب `pending` للمستخدم نُحدّثه بدمج التغييرات الجديدة بدل إنشاء صف جديد.
- `onSuccess` يعيد علم `hasPendingReview` لاستخدامه في الـ toast.

### 2) `src/pages/Profile.tsx`
- بعد الحفظ:
  - إذا عاد `hasPendingReview`: toast بعنوان "تم إرسال التعديلات للمراجعة" والوصف الحالي "سيتم مراجعته من قبل فريق المنصة قبل اعتماده".
  - إذا لا: toast الحالي "تم تحديث الملف الشخصي".
- إظهار شريط أعلى نموذج البروفايل عند وجود طلب `pending` للمستخدم: "لديك تعديلات قيد مراجعة الإدارة" مع ملخّص الحقول المطلوبة.
- في حقول النموذج، عرض **قيمة محفوظة** (الحالية في DB) و **قيمة قيد المراجعة** بصورة ثانوية (badge صغير "قيد المراجعة: …") لكي لا يُربك المستخدم.

### 3) صفحة جديدة `src/pages/admin/AdminEditRequests.tsx`
- جدول لطلبات التعديل (filterable: pending/approved/rejected).
- فتح طلب ⇒ Sheet/Dialog يعرض:
  - معلومات المستخدم (الاسم، الدور، رقم المستخدم).
  - **مقارنة جنباً إلى جنب**: حقل / القيمة القديمة / القيمة الجديدة، مع تمييز التغييرات.
  - ملاحظة من المستخدم (`message`).
  - أزرار: **موافقة** (يستدعي `apply_edit_request`) و **رفض** (يفتح حقل سبب ثم `reject_edit_request`).
- إضافة الصفحة إلى الراوتر `src/App.tsx` تحت `/admin/edit-requests` و إلى قائمة الأدمن في `AppSidebar.tsx`.
- شارة عدد الطلبات المعلّقة بجانب رابط القائمة (Hook جديد `useAdminPendingEditRequestsCount`).

### 4) إشعار في `AdminUserDetail.tsx`
- لوحة جانبية صغيرة تظهر فقط إن كان لدى المستخدم طلب تعديل `pending`، مع زر مباشر "مراجعة طلب التعديل".

## ملاحظات
- لن يتغيّر سلوك التوثيق/التعليق نهائياً. الحساب يبقى موثقاً.
- الحقول غير الحساسة تستمر في التحديث الفوري.
- آلية التعديل من قِبل الأدمن (التعديل المباشر من `AdminUserDetail`) تبقى كما هي وتتجاوز قائمة المراجعة.
- لا تأثير على الخدمات (`micro_services.approval`) أو طلبات الجمعية (`projects`) — يبقى تدفقها الحالي.

## ترتيب التنفيذ
1. هجرة قاعدة البيانات (أعمدة `old_values`/`reviewed_*`/`admin_note`، فهارس، سياسة INSERT، الدوال).
2. تعديل `useUpdateProfile` لتقسيم التحديث.
3. تحديث `Profile.tsx` (toasts + شريط حالة + Hook لجلب الطلبات المعلّقة للمستخدم).
4. إنشاء `AdminEditRequests.tsx` + Hook + إضافتها للراوتر والقائمة.
5. شارة على `AdminUserDetail.tsx`.