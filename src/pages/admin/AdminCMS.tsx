import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAllSiteContent, useUpdateSiteContent } from "@/hooks/useSiteContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Plus, Trash2, LayoutTemplate, Globe, Layout, FileText, ArrowRight, Upload, ImageIcon, Eye, EyeOff, Star, Search } from "lucide-react";
import { InvoiceTemplateManager } from "@/components/admin/InvoiceTemplateManager";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/* ═══════════ Page Groups ═══════════ */

const pageGroups = {
  landing: {
    label: "الصفحة الرئيسية",
    description: "Hero، الإحصائيات، المميزات، الطلبات، الخدمات، لماذا المنصة، CTA، آراء العملاء، التواصل",
    icon: Globe,
    keys: ["hero", "stats", "features", "requests_section", "services_section", "trust", "cta", "testimonials", "contact_section"],
    count: 9,
  },
  about: {
    label: "صفحة من نحن",
    description: "محتوى صفحة من نحن",
    icon: Globe,
    keys: ["about"],
    count: 1,
  },
  faq: {
    label: "الأسئلة الشائعة",
    description: "الأسئلة والأجوبة الشائعة",
    icon: Globe,
    keys: ["faq"],
    count: 1,
  },
  layout: {
    label: "الهيدر والفوتر",
    description: "اسم الموقع، القوائم، حقوق النشر",
    icon: Layout,
    keys: ["header", "footer"],
    count: 2,
  },
  invoice: {
    label: "قالب الفاتورة",
    description: "بيانات الشركة والرقم الضريبي",
    icon: FileText,
    keys: ["invoice_template"],
    count: 1,
  },
} as const;

type PageKey = keyof typeof pageGroups;

const sectionLabels: Record<string, string> = {
  hero: "القسم الرئيسي (Hero)",
  stats: "الإحصائيات",
  features: "المميزات",
  requests_section: "قسم طلبات الجمعيات",
  services_section: "قسم الخدمات المتوفرة",
  trust: "لماذا المنصة",
  cta: "دعوة الإجراء (CTA)",
  testimonials: "آراء العملاء",
  contact_section: "قسم التواصل",
  about: "صفحة من نحن",
  faq: "الأسئلة الشائعة",
  header: "الهيدر",
  footer: "الفوتر",
};

// Sections that support visibility toggle
const visibleSections = new Set(["hero", "stats", "features", "requests_section", "services_section", "trust", "cta", "testimonials", "contact_section"]);

/* ═══════════ Field Editors ═══════════ */

function ImageUploadField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `cms/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("service-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("service-images").getPublicUrl(path);
      onChange(urlData.publicUrl);
      toast.success("تم رفع الصورة بنجاح");
    } catch {
      toast.error("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {value && (
        <div className="relative rounded-lg overflow-hidden border h-32 w-full">
          <img src={value} alt="خلفية" className="w-full h-full object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 left-2 h-7 w-7"
            onClick={() => onChange("")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "جارٍ الرفع..." : <><Upload className="h-4 w-4 me-1" />رفع صورة</>}
      </Button>
    </div>
  );
}

function JsonFieldEditor({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[80px]" dir="rtl" />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} dir="rtl" />
      )}
    </div>
  );
}

function ArrayEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item} onChange={(e) => { const next = [...items]; next[i] = e.target.value; onChange(next); }} dir="rtl" />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}><Plus className="h-4 w-4 me-1" />إضافة عنصر</Button>
    </div>
  );
}

function FooterLinksEditor({ links, onChange }: { links: { label: string; url: string }[]; onChange: (links: { label: string; url: string }[]) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">روابط الفوتر</Label>
      {links.map((link, i) => (
        <div key={i} className="flex gap-2">
          <Input value={link.label} onChange={(e) => { const next = [...links]; next[i] = { ...next[i], label: e.target.value }; onChange(next); }} placeholder="العنوان" dir="rtl" />
          <Input value={link.url} onChange={(e) => { const next = [...links]; next[i] = { ...next[i], url: e.target.value }; onChange(next); }} placeholder="الرابط" dir="ltr" />
          <Button variant="ghost" size="icon" onClick={() => onChange(links.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...links, { label: "", url: "#" }])}><Plus className="h-4 w-4 me-1" />إضافة رابط</Button>
    </div>
  );
}

function StatsEditor({ items, onChange }: { items: { value: string; label: string }[]; onChange: (items: { value: string; label: string }[]) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">الإحصائيات</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item.value} onChange={(e) => { const next = [...items]; next[i] = { ...next[i], value: e.target.value }; onChange(next); }} placeholder="القيمة" dir="rtl" className="w-32" />
          <Input value={item.label} onChange={(e) => { const next = [...items]; next[i] = { ...next[i], label: e.target.value }; onChange(next); }} placeholder="التسمية" dir="rtl" />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, { value: "", label: "" }])}><Plus className="h-4 w-4 me-1" />إضافة إحصائية</Button>
    </div>
  );
}

function FeaturesEditor({ items, onChange }: { items: { title: string; desc: string; icon: string }[]; onChange: (items: { title: string; desc: string; icon: string }[]) => void }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">المميزات</Label>
      {items.map((item, i) => (
        <Card key={i} className="p-3">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input value={item.title} onChange={(e) => { const next = [...items]; next[i] = { ...next[i], title: e.target.value }; onChange(next); }} placeholder="العنوان" dir="rtl" />
              <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea value={item.desc} onChange={(e) => { const next = [...items]; next[i] = { ...next[i], desc: e.target.value }; onChange(next); }} placeholder="الوصف" dir="rtl" className="min-h-[60px]" />
          </div>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, { title: "", desc: "", icon: "users" }])}><Plus className="h-4 w-4 me-1" />إضافة ميزة</Button>
    </div>
  );
}

function TestimonialsEditor({ items, onChange }: { items: { name: string; org: string; text: string; rating: number }[]; onChange: (items: any[]) => void }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">الشهادات</Label>
      {items.map((item, i) => (
        <Card key={i} className="p-3">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input value={item.name} onChange={(e) => { const next = [...items]; next[i] = { ...next[i], name: e.target.value }; onChange(next); }} placeholder="الاسم" dir="rtl" />
              <Input value={item.org} onChange={(e) => { const next = [...items]; next[i] = { ...next[i], org: e.target.value }; onChange(next); }} placeholder="الجهة" dir="rtl" />
              <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea value={item.text} onChange={(e) => { const next = [...items]; next[i] = { ...next[i], text: e.target.value }; onChange(next); }} placeholder="نص الشهادة" dir="rtl" className="min-h-[60px]" />
          </div>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, { name: "", org: "", text: "", rating: 5 }])}><Plus className="h-4 w-4 me-1" />إضافة شهادة</Button>
    </div>
  );
}

/* ═══════════ Featured Pickers ═══════════ */

function FeaturedServicesPicker() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: services, isLoading } = useQuery({
    queryKey: ["cms-all-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("id, title, is_featured, approval, provider:profiles!micro_services_provider_id_fkey(full_name)")
        .eq("approval", "approved")
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from("micro_services").update({ is_featured: !current } as any).eq("id", id);
    if (error) { toast.error("فشل التحديث"); return; }
    qc.invalidateQueries({ queryKey: ["cms-all-services"] });
    qc.invalidateQueries({ queryKey: ["landing-featured-services"] });
    toast.success(!current ? "تم تمييز الخدمة" : "تم إلغاء التمييز");
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  const all = services || [];
  const featuredCount = all.filter((s: any) => s.is_featured).length;
  const q = search.trim().toLowerCase();
  const filtered = q
    ? all.filter((s: any) => s.title?.toLowerCase().includes(q) || s.provider?.full_name?.toLowerCase().includes(q))
    : all;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-primary" />
          الخدمات المميزة في الصفحة الرئيسية
        </Label>
        <span className="text-xs text-muted-foreground">{featuredCount} مميزة من {all.length}</span>
      </div>
      <div className="relative">
        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث باسم الخدمة أو مقدم الخدمة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9 h-9 text-sm"
          dir="rtl"
        />
      </div>
      <div className="border rounded-lg max-h-72 overflow-y-auto divide-y">
        {filtered.map((s: any) => (
          <div key={s.id} className={`flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors ${s.is_featured ? "bg-primary/5" : ""}`}>
            <div className="min-w-0 flex-1 me-3">
              <div className="flex items-center gap-1.5">
                {s.is_featured && <Star className="h-3 w-3 text-primary shrink-0 fill-primary" />}
                <p className="text-sm font-medium truncate">{s.title}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{s.provider?.full_name}</p>
            </div>
            <Switch
              checked={!!s.is_featured}
              onCheckedChange={() => toggle(s.id, !!s.is_featured)}
              aria-label="تمييز الخدمة"
            />
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{q ? "لا توجد نتائج" : "لا توجد خدمات معتمدة"}</p>}
      </div>
    </div>
  );
}

function FeaturedProjectsPicker() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: projects, isLoading } = useQuery({
    queryKey: ["cms-all-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, is_featured, status, association:profiles!projects_association_id_fkey(full_name, organization_name)")
        .eq("status", "open")
        .eq("is_private", false)
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from("projects").update({ is_featured: !current } as any).eq("id", id);
    if (error) { toast.error("فشل التحديث"); return; }
    qc.invalidateQueries({ queryKey: ["cms-all-projects"] });
    qc.invalidateQueries({ queryKey: ["landing-featured-projects"] });
    toast.success(!current ? "تم تمييز الطلب" : "تم إلغاء التمييز");
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  const all = projects || [];
  const featuredCount = all.filter((p: any) => p.is_featured).length;
  const q = search.trim().toLowerCase();
  const filtered = q
    ? all.filter((p: any) => p.title?.toLowerCase().includes(q) || p.association?.organization_name?.toLowerCase().includes(q) || p.association?.full_name?.toLowerCase().includes(q))
    : all;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-primary" />
          الطلبات المميزة في الصفحة الرئيسية
        </Label>
        <span className="text-xs text-muted-foreground">{featuredCount} مميزة من {all.length}</span>
      </div>
      <div className="relative">
        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث باسم الطلب أو الجمعية..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9 h-9 text-sm"
          dir="rtl"
        />
      </div>
      <div className="border rounded-lg max-h-72 overflow-y-auto divide-y">
        {filtered.map((p: any) => (
          <div key={p.id} className={`flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors ${p.is_featured ? "bg-primary/5" : ""}`}>
            <div className="min-w-0 flex-1 me-3">
              <div className="flex items-center gap-1.5">
                {p.is_featured && <Star className="h-3 w-3 text-primary shrink-0 fill-primary" />}
                <p className="text-sm font-medium truncate">{p.title}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{p.association?.organization_name || p.association?.full_name}</p>
            </div>
            <Switch
              checked={!!p.is_featured}
              onCheckedChange={() => toggle(p.id, !!p.is_featured)}
              aria-label="تمييز الطلب"
            />
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{q ? "لا توجد نتائج" : "لا توجد طلبات مفتوحة"}</p>}
      </div>
    </div>
  );
}



function SectionEditor({ sectionKey, content: initial }: { sectionKey: string; content: Record<string, any> }) {
  const [content, setContent] = useState(initial);
  const update = useUpdateSiteContent();

  useEffect(() => { setContent(initial); }, [initial]);

  const set = (key: string, value: any) => setContent((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    update.mutate({ sectionKey, content }, {
      onSuccess: () => toast.success(`تم حفظ قسم "${sectionLabels[sectionKey] || sectionKey}"`),
      onError: () => toast.error("حدث خطأ أثناء الحفظ"),
    });
  };

  const isVisible = content.visible !== false;
  const supportsVisibility = visibleSections.has(sectionKey);

  const renderFields = () => {
    switch (sectionKey) {
      case "hero":
        return (
          <div className="space-y-3">
            <ImageUploadField label="صورة خلفية الهيدر" value={content.bg_image || ""} onChange={(v) => set("bg_image", v)} />
            <JsonFieldEditor label="الشارة" value={content.badge || ""} onChange={(v) => set("badge", v)} />
            <JsonFieldEditor label="العنوان الرئيسي" value={content.title || ""} onChange={(v) => set("title", v)} />
            <JsonFieldEditor label="العنوان الفرعي" value={content.subtitle || ""} onChange={(v) => set("subtitle", v)} />
            <JsonFieldEditor label="الوصف" value={content.description || ""} onChange={(v) => set("description", v)} multiline />
            <JsonFieldEditor label="نص الزر" value={content.cta_text || ""} onChange={(v) => set("cta_text", v)} />
          </div>
        );
      case "stats":
        return <StatsEditor items={content.items || []} onChange={(items) => set("items", items)} />;
      case "features":
        return (
          <div className="space-y-3">
            <JsonFieldEditor label="العنوان" value={content.title || ""} onChange={(v) => set("title", v)} />
            <JsonFieldEditor label="العنوان الفرعي" value={content.subtitle || ""} onChange={(v) => set("subtitle", v)} />
            <FeaturesEditor items={content.items || []} onChange={(items) => set("items", items)} />
          </div>
        );
      case "requests_section":
        return (
          <div className="space-y-3">
            <JsonFieldEditor label="العنوان" value={content.title || ""} onChange={(v) => set("title", v)} />
            <JsonFieldEditor label="العنوان الفرعي" value={content.subtitle || ""} onChange={(v) => set("subtitle", v)} multiline />
            <JsonFieldEditor label="نص الزر" value={content.button_text || ""} onChange={(v) => set("button_text", v)} />
            <Separator />
            <FeaturedProjectsPicker />
          </div>
        );
      case "services_section":
        return (
          <div className="space-y-3">
            <JsonFieldEditor label="العنوان" value={content.title || ""} onChange={(v) => set("title", v)} />
            <JsonFieldEditor label="العنوان الفرعي" value={content.subtitle || ""} onChange={(v) => set("subtitle", v)} multiline />
            <JsonFieldEditor label="نص الزر" value={content.button_text || ""} onChange={(v) => set("button_text", v)} />
            <Separator />
            <FeaturedServicesPicker />
          </div>
        );
      case "trust":
        return (
          <div className="space-y-3">
            <JsonFieldEditor label="الشارة" value={content.badge || ""} onChange={(v) => set("badge", v)} />
            <JsonFieldEditor label="العنوان" value={content.title || ""} onChange={(v) => set("title", v)} />
            <ArrayEditor label="النقاط" items={content.items || []} onChange={(items) => set("items", items)} />
          </div>
        );
      case "cta":
        return (
          <div className="space-y-3">
            <JsonFieldEditor label="العنوان" value={content.title || ""} onChange={(v) => set("title", v)} />
            <JsonFieldEditor label="الوصف" value={content.description || ""} onChange={(v) => set("description", v)} multiline />
            <JsonFieldEditor label="نص الزر" value={content.button_text || ""} onChange={(v) => set("button_text", v)} />
          </div>
        );
      case "testimonials":
        return (
          <div className="space-y-3">
            <JsonFieldEditor label="العنوان" value={content.title || ""} onChange={(v) => set("title", v)} />
            <JsonFieldEditor label="العنوان الفرعي" value={content.subtitle || ""} onChange={(v) => set("subtitle", v)} />
            <TestimonialsEditor items={content.items || []} onChange={(items) => set("items", items)} />
          </div>
        );
      case "contact_section":
        return (
          <div className="space-y-3">
            <JsonFieldEditor label="العنوان" value={content.title || ""} onChange={(v) => set("title", v)} />
            <JsonFieldEditor label="العنوان الفرعي" value={content.subtitle || ""} onChange={(v) => set("subtitle", v)} multiline />
          </div>
        );
      case "header":
        return (
          <div className="space-y-3">
            <JsonFieldEditor label="اسم الموقع" value={content.site_name || ""} onChange={(v) => set("site_name", v)} />
            <JsonFieldEditor label="نص تسجيل الدخول" value={content.login_text || ""} onChange={(v) => set("login_text", v)} />
            <JsonFieldEditor label="نص إنشاء حساب" value={content.register_text || ""} onChange={(v) => set("register_text", v)} />
          </div>
        );
      case "footer":
        return (
          <div className="space-y-3">
            <JsonFieldEditor label="اسم الموقع" value={content.site_name || ""} onChange={(v) => set("site_name", v)} />
            <JsonFieldEditor label="حقوق النشر" value={content.copyright || ""} onChange={(v) => set("copyright", v)} />
            <FooterLinksEditor links={content.links || []} onChange={(links) => set("links", links)} />
          </div>
        );
      default:
        return (
          <Textarea
            value={JSON.stringify(content, null, 2)}
            onChange={(e) => { try { setContent(JSON.parse(e.target.value)); } catch {} }}
            className="min-h-[200px] font-mono text-xs"
            dir="ltr"
          />
        );
    }
  };

  return (
    <Card className={!isVisible && supportsVisibility ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{sectionLabels[sectionKey] || sectionKey}</CardTitle>
            {supportsVisibility && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={isVisible}
                  onCheckedChange={(checked) => set("visible", checked)}
                  aria-label="إظهار/إخفاء القسم"
                />
                <span className="text-xs text-muted-foreground">
                  {isVisible ? <span className="flex items-center gap-1"><Eye className="h-3 w-3" />ظاهر</span> : <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" />مخفي</span>}
                </span>
              </div>
            )}
          </div>
          <Button size="sm" onClick={handleSave} disabled={update.isPending}>
            <Save className="h-4 w-4 me-1" />
            {update.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>{renderFields()}</CardContent>
    </Card>
  );
}

/* ═══════════ Page Selection Cards ═══════════ */

function PageSelectionGrid({ onSelect }: { onSelect: (key: PageKey) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.entries(pageGroups) as [PageKey, typeof pageGroups[PageKey]][]).map(([key, group]) => {
        const Icon = group.icon;
        return (
          <Card
            key={key}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
            onClick={() => onSelect(key)}
          >
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{group.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {group.count} {group.count > 2 ? "أقسام" : "قسم"}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ═══════════ Main Page ═══════════ */

export default function AdminCMS() {
  const { data: sections, isLoading } = useAllSiteContent();
  const [selectedPage, setSelectedPage] = useState<PageKey | null>(null);

  const selectedGroup = selectedPage ? pageGroups[selectedPage] : null;

  const filteredSections = selectedGroup
    ? (selectedGroup.keys as readonly string[]).map(key => 
        (sections ?? []).find((s: any) => s.section_key === key)
      ).filter(Boolean)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <LayoutTemplate className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة المحتوى</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedGroup ? selectedGroup.label : "اختر الصفحة أو القالب الذي تريد تعديله"}
            </p>
          </div>
        </div>
        <Separator />

        {/* Back button when inside a group */}
        {selectedPage && (
          <Button variant="outline" size="sm" onClick={() => setSelectedPage(null)}>
            <ArrowRight className="h-4 w-4 me-1" />
            رجوع للقائمة
          </Button>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : !selectedPage ? (
          <PageSelectionGrid onSelect={setSelectedPage} />
        ) : selectedPage === "invoice" ? (
          <InvoiceTemplateManager />
        ) : (
          <div className="space-y-4">
            {filteredSections.map((section: any) => (
              <SectionEditor
                key={section.section_key}
                sectionKey={section.section_key}
                content={section.content}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
