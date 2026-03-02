
-- CMS: site_content table for dynamic page content
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read site content (public pages)
CREATE POLICY "Public read site content"
  ON public.site_content FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admin manage site content"
  ON public.site_content FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed default content
INSERT INTO public.site_content (section_key, content) VALUES
('hero', '{"badge":" المنصة الأولى لتمكين الجمعيات الشبابية في المملكة","title":"منصة الخدمات المشتركة","subtitle":"للجمعيات الشبابية","description":"منصة رقمية سعودية تربط الجمعيات الشبابية بمقدمي الخدمات المؤهلين والمانحين لتعزيز التميز المؤسسي والشفافية","cta_text":"ابدأ الآن"}'::jsonb),
('stats', '{"items":[{"value":"100+","label":"جمعية شبابية"},{"value":"500+","label":"مقدم خدمة"},{"value":"1,200+","label":"مشروع منجز"},{"value":"5M+","label":"ريال سعودي"}]}'::jsonb),
('features', '{"title":"كيف تعمل المنصة","subtitle":"ثلاثة أدوار رئيسية تعمل معاً لتحقيق أهداف مشتركة","items":[{"title":"الجمعيات الشبابية","desc":"أنشئ مشاريعك وابحث عن أفضل مقدمي الخدمات المؤهلين لتنفيذها","icon":"users"},{"title":"مقدمو الخدمات","desc":"اعرض خدماتك وقدم عروضك على المشاريع المتاحة وتتبع أرباحك","icon":"store"},{"title":"المانحون","desc":"ادعم الجمعيات بتمويل المشاريع وتابع أثر تبرعاتك بشفافية","icon":"coins"}]}'::jsonb),
('trust', '{"badge":"أمان وشفافية كاملة","title":"لماذا الخدمات المشتركة؟","items":["نظام ضمان مالي (Escrow) يحمي جميع الأطراف","عقود رقمية ملزمة بين الجمعيات ومقدمي الخدمات","تقييم ثلاثي الأبعاد: الجودة والوقت والتواصل","فواتير إلكترونية متوافقة مع هيئة الزكاة والضريبة","سجل تدقيق كامل لجميع العمليات","لوحات تحكم مخصصة لكل دور"]}'::jsonb),
('cta', '{"title":"ابدأ رحلتك الآن","description":"انضم إلى المنصة وابدأ في تحقيق أهدافك مع شبكة واسعة من الشركاء","button_text":"سجّل مجاناً"}'::jsonb),
('header', '{"site_name":"الخدمات المشتركة","login_text":"تسجيل الدخول","register_text":"إنشاء حساب"}'::jsonb),
('footer', '{"site_name":"منصة الخدمات المشتركة","copyright":"جميع الحقوق محفوظة — رؤية 2030","links":[{"label":"عن المنصة","url":"#"},{"label":"الشروط والأحكام","url":"#"},{"label":"سياسة الخصوصية","url":"#"},{"label":"تواصل معنا","url":"#"}]}'::jsonb);
