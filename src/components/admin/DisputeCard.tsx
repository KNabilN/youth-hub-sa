import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateDispute } from "@/hooks/useAdminDisputes";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DisputeStatus = Database["public"]["Enums"]["dispute_status"];

const statusColors: Record<string, string> = {
  open: "bg-destructive/10 text-destructive",
  under_review: "bg-yellow-500/10 text-yellow-600",
  resolved: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  open: "مفتوح",
  under_review: "قيد المراجعة",
  resolved: "تم الحل",
  closed: "مغلق",
};

export function DisputeCard({ dispute }: { dispute: any }) {
  const updateDispute = useUpdateDispute();
  const [newStatus, setNewStatus] = useState<DisputeStatus>(dispute.status);
  const [notes, setNotes] = useState(dispute.resolution_notes || "");
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    updateDispute.mutate({ id: dispute.id, status: newStatus, resolution_notes: notes }, {
      onSuccess: () => { toast.success("تم تحديث النزاع"); setEditing(false); },
      onError: () => toast.error("حدث خطأ"),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{dispute.projects?.title ?? "مشروع غير معروف"}</CardTitle>
          <p className="text-xs text-muted-foreground">بواسطة: {dispute.profiles?.full_name ?? "—"} · {format(new Date(dispute.created_at), "yyyy/MM/dd", { locale: ar })}</p>
        </div>
        <Badge className={statusColors[dispute.status]}>{statusLabels[dispute.status]}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{dispute.description}</p>
        {editing ? (
          <div className="space-y-3 border-t pt-3">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DisputeStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">مفتوح</SelectItem>
                <SelectItem value="under_review">قيد المراجعة</SelectItem>
                <SelectItem value="resolved">تم الحل</SelectItem>
                <SelectItem value="closed">مغلق</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="ملاحظات الحل..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateDispute.isPending}>حفظ</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>إلغاء</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t pt-3">
            {dispute.resolution_notes && <p className="text-xs text-muted-foreground">{dispute.resolution_notes}</p>}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>تعديل الحالة</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
