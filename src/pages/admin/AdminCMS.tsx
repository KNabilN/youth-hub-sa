import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAllSiteContent, useUpdateSiteContent } from "@/hooks/useSiteContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileEdit, Save, Plus, Trash2, LayoutTemplate } from "lucide-react";

const sectionLabels: Record<string, string> = {
  hero: "القسم الرئيسي (Hero)",
  stats: "الإحصائيات",
  features: "المميزات",
  trust: "لماذا المنصة",
  cta: "دعوة الإجراء (CTA)",
  header: "الهيدر",
  footer: "الفوتر",
};

function JsonFieldEditor({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
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

function ArrayEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            dir="rtl"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="h-4 w-4 me-1" />
        إضافة عنصر
      </Button>
    </div>
  );
}

function FooterLinksEditor({
  links,
  onChange,
}: {
  links: { label: string; url: string }[];
  onChange: (links: { label: string; url: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">روابط الفوتر</Label>
      {links.map((link, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={link.label}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], label: e.target.value };
              onChange(next);
            }}
            placeholder="العنوان"
            dir="rtl"
          />
          <Input
            value={link.url}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], url: e.target.value };
              onChange(next);
            }}
            placeholder="الرابط"
            dir="ltr"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(links.filter((_, j) => j !== i))}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...links, { label: "", url: "#" }])}
      >
        <Plus className="h-4 w-4 me-1" />
        إضافة رابط
      </Button>
    </div>
  );
}

function StatsEditor({
  items,
  onChange,
}: {
  items: { value: string; label: string }[];
  onChange: (items: { value: string; label: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">الإحصائيات</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item.value}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...next[i], value: e.target.value };
              onChange(next);
            }}
            placeholder="القيمة"
            dir="rtl"
            className="w-32"
          />
          <Input
            value={item.label}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...next[i], label: e.target.value };
              onChange(next);
            }}
            placeholder="التسمية"
            dir="rtl"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { value: "", label: "" }])}
      >
        <Plus className="h-4 w-4 me-1" />
        إضافة إحصائية
      </Button>
    </div>
  );
}

function FeaturesEditor({
  items,
  onChange,
}: {
  items: { title: string; desc: string; icon: string }[];
  onChange: (items: { title: string; desc: string; icon: string }[]) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">المميزات</Label>
      {items.map((item, i) => (
        <Card key={i} className="p-3">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={item.title}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], title: e.target.value };
                  onChange(next);
                }}
                placeholder="العنوان"
                dir="rtl"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={item.desc}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], desc: e.target.value };
                onChange(next);
              }}
              placeholder="الوصف"
              dir="rtl"
              className="min-h-[60px]"
            />
          </div>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { title: "", desc: "", icon: "users" }])}
      >
        <Plus className="h-4 w-4 me-1" />
        إضافة ميزة
      </Button>
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

  const renderFields = () => {
    switch (sectionKey) {
      case "hero":
        return (
          <div className="space-y-3">
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
            onChange={(e) => {
              try { setContent(JSON.parse(e.target.value)); } catch {}
            }}
            className="min-h-[200px] font-mono text-xs"
            dir="ltr"
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{sectionLabels[sectionKey] || sectionKey}</CardTitle>
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

export default function AdminCMS() {
  const { data: sections, isLoading } = useAllSiteContent();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <LayoutTemplate className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة المحتوى</h1>
            <p className="text-sm text-muted-foreground mt-0.5">تعديل محتوى الصفحة الرئيسية والهيدر والفوتر</p>
          </div>
        </div>
        <Separator />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {(sections ?? []).map((section: any) => (
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
