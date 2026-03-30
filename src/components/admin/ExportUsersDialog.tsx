import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadXLSX } from "@/lib/csv-export";
import { toast } from "sonner";

const roleLabelsMap: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

interface ColumnDef {
  key: string;
  label: string;
  getValue: (u: any, roleMap: Map<string, string>) => string;
}

const allColumns: ColumnDef[] = [
  { key: "full_name", label: "الاسم", getValue: (u) => u.full_name || "" },
  { key: "phone", label: "الهاتف", getValue: (u) => u.phone || "" },
  { key: "organization_name", label: "المنظمة", getValue: (u) => u.organization_name || "" },
  { key: "role", label: "الدور", getValue: (u, rm) => roleLabelsMap[rm.get(u.id) ?? ""] || "" },
  { key: "is_verified", label: "التوثيق", getValue: (u) => u.is_verified ? "نعم" : "لا" },
  { key: "is_suspended", label: "الحالة", getValue: (u) => u.is_suspended ? "معلّق" : "نشط" },
  { key: "created_at", label: "تاريخ الانضمام", getValue: (u) => u.created_at?.slice(0, 10) || "" },
  { key: "license_number", label: "رقم الترخيص", getValue: (u) => u.license_number || "" },
  { key: "bio", label: "النبذة", getValue: (u) => u.bio || "" },
  { key: "contact_officer_name", label: "ضابط الاتصال", getValue: (u) => u.contact_officer_name || "" },
  { key: "contact_officer_phone", label: "رقم ضابط الاتصال", getValue: (u) => u.contact_officer_phone || "" },
  { key: "contact_officer_email", label: "بريد ضابط الاتصال", getValue: (u) => u.contact_officer_email || "" },
];

const defaultColumns = ["full_name", "phone", "organization_name", "role", "is_verified", "is_suspended", "created_at"];

interface ExportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportUsersDialog({ open, onOpenChange }: ExportUsersDialogProps) {
  const [exportRole, setExportRole] = useState("all");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultColumns);
  const [exporting, setExporting] = useState(false);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => setSelectedColumns(allColumns.map((c) => c.key));
  const deselectAll = () => setSelectedColumns([]);

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error("يرجى اختيار عمود واحد على الأقل");
      return;
    }

    setExporting(true);
    try {
      const fields = allColumns
        .filter((c) => selectedColumns.includes(c.key) && c.key !== "role")
        .map((c) => c.key)
        .join(", ");

      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select(`id, ${fields}`),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const roleMap = new Map((rolesRes.data ?? []).map((r: any) => [r.user_id, r.role]));

      let rows = profilesRes.data ?? [];
      if (exportRole !== "all") {
        rows = rows.filter((u: any) => roleMap.get(u.id) === exportRole);
      }

      const activeCols = allColumns.filter((c) => selectedColumns.includes(c.key));

      downloadXLSX(
        "users.xlsx",
        activeCols.map((c) => c.label),
        rows.map((u: any) => activeCols.map((c) => c.getValue(u, roleMap)))
      );

      toast.success(`تم تصدير ${rows.length} مستخدم`);
      onOpenChange(false);
    } catch {
      toast.error("حدث خطأ أثناء التصدير");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تصدير المستخدمين</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Role filter */}
          <div className="space-y-1.5">
            <Label>فلتر حسب الدور</Label>
            <Select value={exportRole} onValueChange={setExportRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="youth_association">جمعية شبابية</SelectItem>
                <SelectItem value="service_provider">مقدم خدمة</SelectItem>
                <SelectItem value="donor">مانح</SelectItem>
                <SelectItem value="super_admin">مدير النظام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Column selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>الأعمدة المطلوبة</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>تحديد الكل</Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={deselectAll}>إلغاء الكل</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-muted/40 rounded-lg p-3">
              {allColumns.map((col) => (
                <label key={col.key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={selectedColumns.includes(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleExport} disabled={exporting || selectedColumns.length === 0} className="gap-1">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            تصدير Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
