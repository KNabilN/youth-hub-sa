import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";
import { toast } from "sonner";

export interface ExportColumnDef {
  key: string;
  label: string;
}

export interface ExportFilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  filename: string;
  columns: ExportColumnDef[];
  defaultColumns: string[];
  filters?: ExportFilterDef[];
  onExport: (selectedColumns: string[], filterValues: Record<string, string>) => Promise<{ headers: string[]; rows: string[][] }>;
}

export function ExportDialog({
  open, onOpenChange, title, filename, columns, defaultColumns, filters = [], onExport,
}: ExportDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultColumns);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    Object.fromEntries(filters.map((f) => [f.key, "all"]))
  );
  const [exporting, setExporting] = useState(false);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => setSelectedColumns(columns.map((c) => c.key));
  const deselectAll = () => setSelectedColumns([]);

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error("يرجى اختيار عمود واحد على الأقل");
      return;
    }
    setExporting(true);
    try {
      const result = await onExport(selectedColumns, filterValues);
      downloadCSV(filename, result.headers, result.rows);
      toast.success(`تم التصدير بنجاح`);
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
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-1.5">
              <Label>{filter.label}</Label>
              <Select
                value={filterValues[filter.key] ?? "all"}
                onValueChange={(v) => setFilterValues((prev) => ({ ...prev, [filter.key]: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {filter.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>الأعمدة المطلوبة</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>تحديد الكل</Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={deselectAll}>إلغاء الكل</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-muted/40 rounded-lg p-3">
              {columns.map((col) => (
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
            تصدير CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
