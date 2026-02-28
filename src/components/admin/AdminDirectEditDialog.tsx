import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";
import { toast } from "sonner";

export interface DirectEditFieldConfig {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select";
  selectSource?: "categories" | "regions";
}

interface AdminDirectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValues: Record<string, any>;
  fields: DirectEditFieldConfig[];
  title: string;
  onSave: (updates: Record<string, any>) => Promise<void>;
  isPending?: boolean;
}

export function AdminDirectEditDialog({
  open,
  onOpenChange,
  currentValues,
  fields,
  title,
  onSave,
  isPending,
}: AdminDirectEditDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  useEffect(() => {
    if (open) {
      const init: Record<string, any> = {};
      fields.forEach((f) => {
        init[f.key] = currentValues[f.key] ?? "";
      });
      setValues(init);
    }
  }, [open, currentValues, fields]);

  const handleSubmit = async () => {
    try {
      await onSave(values);
      toast.success("تم حفظ التعديلات بنجاح");
      onOpenChange(false);
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    }
  };

  const getSelectOptions = (source: string) => {
    if (source === "categories") return categories ?? [];
    if (source === "regions") return regions ?? [];
    return [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  rows={3}
                />
              ) : field.type === "select" && field.selectSource ? (
                <Select
                  value={values[field.key] ?? ""}
                  onValueChange={(val) => setValues((v) => ({ ...v, [field.key]: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getSelectOptions(field.selectSource).map((opt: any) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
