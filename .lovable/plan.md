

## إضافة بيانات الجمعيات الشبابية

### ملخص
الملف يحتوي على بيانات 67 جمعية شبابية تحتاج إلى تسجيل في النظام. هناك 5 حقول جديدة غير موجودة في قاعدة البيانات يجب إضافتها أولاً، ثم تسجيل جميع الجمعيات.

### الخطوات

**1. إضافة الحقول الجديدة لجدول profiles**

الحقول المفقودة:
- `license_number` (رقم الترخيص) - نص
- `contact_officer_name` (اسم ضابط الاتصال) - نص
- `contact_officer_phone` (رقم ضابط الاتصال) - نص
- `contact_officer_email` (البريد الإلكتروني لضابط الاتصال) - نص
- `contact_officer_title` (صفة ضابط الاتصال) - نص

سيتم إضافتها عبر migration بقيم افتراضية فارغة.

**2. إنشاء Edge Function لتسجيل الجمعيات**

سيتم إنشاء backend function باسم `bulk-create-associations` تقوم بـ:
- إنشاء حساب مستخدم لكل جمعية باستخدام البريد الإلكتروني وكلمة المرور
- إدخال بيانات الملف الشخصي (اسم الجمعية، رقم الترخيص، الهاتف، بيانات ضابط الاتصال)
- تعيين الدور `youth_association` (يتم تلقائياً عبر trigger الموجود)
- تفعيل التحقق `is_verified = true`

**3. تحديث واجهة الملف الشخصي**

إضافة الحقول الجديدة في صفحة الملف الشخصي وصفحة تفاصيل المستخدم في لوحة الإدارة حتى تكون قابلة للعرض والتعديل.

### تفاصيل تقنية

```text
Migration SQL:
  ALTER TABLE profiles
    ADD COLUMN license_number text DEFAULT '',
    ADD COLUMN contact_officer_name text DEFAULT '',
    ADD COLUMN contact_officer_phone text DEFAULT '',
    ADD COLUMN contact_officer_email text DEFAULT '',
    ADD COLUMN contact_officer_title text DEFAULT '';
```

Edge function flow:
1. Receives array of association data
2. For each entry: `supabase.auth.admin.createUser()` with email + password + metadata
3. The existing `handle_new_user` trigger auto-creates the profile
4. Update the profile with all additional fields (license, contact officer info)
5. Set `is_verified = true`
6. Returns summary of successes/failures

Data notes:
- 67 associations total from the spreadsheet
- Passwords provided in plaintext in the spreadsheet
- `full_name` will be set to اسم ضابط الاتصال (contact officer name)
- `organization_name` will be set to اسم الجمعية

