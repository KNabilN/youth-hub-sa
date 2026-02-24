import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateEditRequest } from "@/hooks/useEditRequests";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea";
}

interface EditRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetTable: string;
  targetId: string;
  targetUserId: string;
  currentValues: Record<string, any>;
  fields: FieldConfig[];
  title?: string;
}

export function EditRequestDialog({
  open, onOpenChange, targetTable, targetId, targetUserId, currentValues, fields, title = "طلب تعديل",
}: EditRequestDialogProps) {
  const { user } = useAuth();
  const createRequest = useCreateEditRequest();
  const [form, setForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const handleOpen = (o: boolean) => {
    if (o) {
      const initial: Record<string, string> = {};
      fields.forEach((f) => {
        initial[f.key] = currentValues[f.key]?.toString() ?? "";
      });
      setForm(initial);
      setMessage("");
    }
    onOpenChange(o);
  };

  const handleSubmit = () => {
    if (!user) return;
    // Only include changed fields
    const changes: Record<string, any> = {};
    fields.forEach((f) => {
      const newVal = f.type === "number" ? Number(form[f.key]) : form[f.key];
      const oldVal = currentValues[f.key];
      if (String(newVal) !== String(oldVal ?? "")) {
        changes[f.key] = newVal;
      }
    });

    if (Object.keys(changes).length === 0) {
      toast.error("لم يتم تغيير أي قيمة");
      return;
    }

    createRequest.mutate(
      {
        target_table: targetTable,
        target_id: targetId,
        target_user_id: targetUserId,
        requested_changes: changes,
        message,
        requested_by: user.id,
      },
      {
        onSuccess: () => {
          toast.success("تم إرسال طلب التعديل");
          onOpenChange(false);
        },
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {fields.map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  rows={3}
                />
              ) : (
                <Input
                  type={f.type === "number" ? "number" : "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div>
            <Label>رسالة للمستخدم (اختياري)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="اشرح سبب التعديل المطلوب..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={createRequest.isPending}>
            {createRequest.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
