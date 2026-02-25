import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContent, useUpdateSiteContent } from "@/hooks/useSiteContent";
import { toast } from "sonner";
import { FileText } from "lucide-react";

interface InvoiceTemplate {
  company_name: string;
  company_name_en: string;
  vat_number: string;
  cr_number: string;
  address: string;
  footer_text: string;
  logo_url: string;
}

const defaultTemplate: InvoiceTemplate = {
  company_name: "منصة الشباب",
  company_name_en: "Youth Hub SA",
  vat_number: "300000000000003",
  cr_number: "1234567890",
  address: "المملكة العربية السعودية",
  footer_text: "هذه فاتورة إلكترونية صادرة من النظام ولا تحتاج لتوقيع.",
  logo_url: "",
};

export function InvoiceTemplateManager() {
  const { data: content } = useSiteContent("invoice_template");
  const updateContent = useUpdateSiteContent();

  const saved = (content?.content as unknown as InvoiceTemplate) ?? defaultTemplate;
  const [form, setForm] = useState<InvoiceTemplate>(saved);
  const [dirty, setDirty] = useState(false);

  const handleChange = (key: keyof InvoiceTemplate, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    updateContent.mutate(
      { sectionKey: "invoice_template", content: form as any },
      {
        onSuccess: () => { toast.success("تم حفظ إعدادات الفاتورة"); setDirty(false); },
        onError: () => toast.error("حدث خطأ أثناء الحفظ"),
      }
    );
  };

  const fields: { key: keyof InvoiceTemplate; label: string; placeholder: string }[] = [
    { key: "company_name", label: "اسم الشركة (عربي)", placeholder: "منصة الشباب" },
    { key: "company_name_en", label: "اسم الشركة (إنجليزي)", placeholder: "Youth Hub SA" },
    { key: "vat_number", label: "الرقم الضريبي", placeholder: "300000000000003" },
    { key: "cr_number", label: "السجل التجاري", placeholder: "1234567890" },
    { key: "address", label: "العنوان", placeholder: "المملكة العربية السعودية" },
    { key: "logo_url", label: "رابط الشعار (اختياري)", placeholder: "https://..." },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          قالب الفاتورة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(f => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            <Input
              value={form[f.key]}
              onChange={e => handleChange(f.key, e.target.value)}
              placeholder={f.placeholder}
            />
          </div>
        ))}
        <div className="space-y-1">
          <Label className="text-xs">نص ذيل الفاتورة</Label>
          <Textarea
            value={form.footer_text}
            onChange={e => handleChange("footer_text", e.target.value)}
            rows={2}
          />
        </div>
        <Button onClick={handleSave} disabled={!dirty || updateContent.isPending} className="w-full">
          {updateContent.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </CardContent>
    </Card>
  );
}
