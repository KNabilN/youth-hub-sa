

## خطة: نظام طلبات المنح بين الجمعيات والمانحين

### الفكرة العامة

إنشاء جدول `grant_requests` يمثل طلبات الدعم من الجمعيات، إما عامة (مرئية لجميع المانحين) أو موجهة لمانح بعينه، مع ربطها اختيارياً بمشروع محدد. هذا يفصل بين "طلب المنحة" و"التبرع الفعلي" ويتيح تتبع الفلو كاملاً.

### 1. تعديل قاعدة البيانات — جدول `grant_requests`

```sql
CREATE TABLE public.grant_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL,          -- الجمعية الطالبة
  donor_id uuid DEFAULT NULL,            -- NULL = طلب عام، أو UUID = طلب موجه لمانح
  project_id uuid DEFAULT NULL,          -- NULL = منحة عامة، أو UUID = لمشروع محدد
  amount numeric NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, funded
  admin_note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.grant_requests ENABLE ROW LEVEL SECURITY;

-- الجمعية ترى وتنشئ طلباتها
CREATE POLICY "Associations manage own grant requests"
  ON grant_requests FOR ALL TO authenticated
  USING (association_id = auth.uid())
  WITH CHECK (association_id = auth.uid());

-- المانح يرى الطلبات العامة + الموجهة له
CREATE POLICY "Donors view grant requests"
  ON grant_requests FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'donor') AND
    (donor_id IS NULL OR donor_id = auth.uid()) AND
    status IN ('pending', 'approved')
  );

-- الأدمن يدير الكل
CREATE POLICY "Admin manage all grant requests"
  ON grant_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));
```

- إضافة trigger إشعارات: عند إنشاء طلب موجه → إشعار للمانح، عند تغيير الحالة → إشعار للجمعية

### 2. صفحات جديدة

| الصفحة | المسار | الدور | الوصف |
|--------|--------|------|-------|
| طلبات الدعم (تصفح) | `/grant-requests` | donor | عرض كل طلبات الجمعيات العامة + الموجهة للمانح، مع فلاتر |
| طلبات الدعم الواردة | `/my-grant-requests` | donor | طلبات موجهة لهذا المانح تحديداً |
| المانحون | `/donors` | youth_association | عرض المانحين الموثقين + زر "طلب منحة" |
| طلبات المنح الخاصة بي | `/my-grants` | youth_association | عرض طلبات المنح التي أنشأتها الجمعية |

### 3. تعديل القائمة الجانبية (`AppSidebar.tsx`)

**للمانح:**
- إضافة "طلبات الدعم" → `/grant-requests`
- إضافة "طلبات واردة" → `/my-grant-requests`

**للجمعية:**
- إضافة "المانحون" → `/donors`
- إضافة "طلبات المنح" → `/my-grants`

### 4. صفحة المانحون للجمعيات (`/donors`)

- عرض قائمة المانحين الموثقين (عبر `user_roles` + `profiles`)
- كل بطاقة مانح بها زر "طلب منحة" يفتح Dialog لإنشاء `grant_request`
- Dialog يحتوي: نوع المنحة (عامة/لمشروع)، اختيار المشروع، المبلغ، الوصف
- دالة RPC `get_verified_donor_ids` مماثلة لـ `get_verified_association_ids`

### 5. صفحة طلبات الدعم للمانح (`/grant-requests`)

- عرض بطاقات طلبات الجمعيات المفتوحة (عامة + موجهة)
- فلاتر: اسم الجمعية، نطاق المبلغ
- زر "تبرع" على كل طلب → ينتقل لصفحة المنح (`/donations`) مع تعبئة البيانات تلقائياً

### 6. صفحة طلبات المنح الخاصة بالجمعية (`/my-grants`)

- عرض جدول/بطاقات بطلبات المنح التي أنشأتها الجمعية
- عرض الحالة (بانتظار / موافق / مرفوض / ممول)
- زر "طلب منحة جديدة" يفتح نفس الـ Dialog

### 7. تعديل إنشاء الطلب (`ProjectForm.tsx`)

- إضافة خيار "طلب منحة" عند إنشاء مشروع (switch أو checkbox)
- إذا مفعّل: يظهر حقل "نوع المنحة" (عامة / من مانح محدد) + اختيار المانح
- بعد إنشاء المشروع بنجاح، يتم إنشاء `grant_request` تلقائياً مرتبط بالمشروع

### 8. الفلو الكامل

```text
الجمعية تنشئ طلب منحة (عام أو موجه)
         ↓
يظهر في صفحة طلبات الدعم للمانحين
         ↓
المانح يضغط "تبرع" → ينتقل لصفحة المنح بالبيانات معبأة
         ↓
المانح يرفع إيصال تحويل → يُنشأ escrow + bank_transfer
         ↓
الأدمن يراجع → يوافق أو يرفض
         ↓
عند الموافقة: grant_request.status → 'funded'
         + باقي الفلو حسب النوع (فاتورة + عقد... الخ)
```

### الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| **جديد** `src/pages/GrantRequests.tsx` | صفحة تصفح طلبات الدعم (مانح) |
| **جديد** `src/pages/MyGrantRequests.tsx` | طلبات واردة للمانح |
| **جديد** `src/pages/Donors.tsx` | صفحة المانحين (جمعية) |
| **جديد** `src/pages/MyGrants.tsx` | طلبات المنح (جمعية) |
| **جديد** `src/hooks/useGrantRequests.ts` | CRUD + queries |
| `src/components/AppSidebar.tsx` | إضافة عناصر القائمة |
| `src/App.tsx` | إضافة Routes |
| `src/components/projects/ProjectForm.tsx` | خيار طلب منحة |
| `src/pages/ProjectCreate.tsx` | إنشاء grant_request بعد المشروع |
| `src/hooks/useBankTransfer.ts` | تحديث status الـ grant_request عند الموافقة |
| Migration | جدول grant_requests + RPC + trigger |

