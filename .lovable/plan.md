

## التنظيف المطلوب في `src/pages/MyServices.tsx`

نموذج `ServiceForm` بعد التبسيط لم يعد يقبل props أو حقول الصور/المعرض/الباقات/الأسئلة، لكن `MyServices.tsx` لا يزال يمررها. سأحذف كل ما لا فائدة منه.

### التغييرات

**1. حذف props غير موجودة في `ServiceForm` عند فتح نافذة التعديل:**
- إزالة `defaultImageUrl={(editingService as any).image_url}`
- إزالة `defaultGallery={(editingService as any).gallery ?? []}`
- إزالة `long_description` من `defaultValues` (لم يعد ضمن نموذج النشر الجديد — تم إعادة استخدامه ضمن "المخرجات والتسليمات" والتي يديرها الـ ServiceForm نفسه عبر defaultValues إذا توفّرت)
  - **تصحيح**: حقل `long_description` ما زال جزءاً من schema الجديد (يمثّل "المخرجات والتسليمات")، لذا يبقى ضمن `defaultValues`. سنزيل فقط الـ casts غير الضرورية ونحوله إلى وصول مباشر.

**2. تنظيف الـ `as any` غير الضرورية:**
- استخدام النوع المُصدَّر `ServiceFormValues` بدل `any` في معالِجات `handleCreate` / `handleCreateDraft` / `handleEdit`
- إزالة `as any` من mutate calls

**3. حذف الـ import غير المستخدم:**
- `ServiceFormValues` كان مستورداً لكن غير مستخدم → سيُستخدم الآن في تواقيع المعالِجات

### النتيجة النهائية لـ `MyServices.tsx`
- لا إشارة إلى `image_url`, `gallery`, `packages`, `faq`, `service_type`, `defaultImageUrl`, `defaultGallery`
- type-safe بدون `as any` العشوائي
- نموذج التعديل يمرر فقط الحقول الستة المعتمدة: `title, description, long_description, category_id, region_id, price`

### الملفات المتأثرة
- `src/pages/MyServices.tsx` فقط — لا تغييرات على قاعدة البيانات أو على `ServiceForm` أو على `MyServiceCard` (الأخير لا يزال يعرض الصورة إن وُجدت في الخدمات القديمة، وهذا سلوك مرغوب).

