import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateDispute } from "@/hooks/useAdminDisputes";
import { DisputeResponseThread } from "@/components/disputes/DisputeResponseThread";
import { DisputeFinancialImpact } from "@/components/disputes/DisputeFinancialImpact";
import { DisputeTimeline } from "@/components/disputes/DisputeTimeline";
import { disputeStatusLabels, disputeStatusColors, allDisputeStatuses } from "@/lib/dispute-statuses";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { Banknote, ArrowDownCircle, Lock, Unlock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type DisputeStatus = Database["public"]["Enums"]["dispute_status"];

export function DisputeCard({ dispute }: { dispute: any }) {
  const updateDispute = useUpdateDispute();
  const [newStatus, setNewStatus] = useState<DisputeStatus>(dispute.status);
  const [notes, setNotes] = useState(dispute.resolution_notes || "");
  const [editing, setEditing] = useState(false);
  const [escrowLoading, setEscrowLoading] = useState(false);

  const handleSave = () => {
    updateDispute.mutate({ id: dispute.id, status: newStatus, resolution_notes: notes }, {
      onSuccess: () => { toast.success("تم تحديث النزاع"); setEditing(false); },
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const handleEscrowAction = async (action: "release" | "refund" | "freeze" | "unfreeze") => {
    setEscrowLoading(true);
    try {
      const targetStatus = (action === "release" ? "released" : action === "refund" ? "refunded" : action === "freeze" ? "frozen" : "held") as Database["public"]["Enums"]["escrow_status"];
      const fromStatuses = (action === "release" ? ["held", "frozen"] : action === "refund" ? ["held", "frozen"] : action === "freeze" ? ["held"] : ["frozen"]) as Database["public"]["Enums"]["escrow_status"][];

      const { error } = await supabase
        .from("escrow_transactions")
        .update({ status: targetStatus })
        .eq("project_id", dispute.project_id)
        .in("status", fromStatuses);
      if (error) throw error;
      toast.success("تم تحديث حالة الضمان المالي");
    } catch {
      toast.error("حدث خطأ أثناء تحديث الضمان");
    } finally {
      setEscrowLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{dispute.projects?.title ?? "طلب غير معروف"}</CardTitle>
          <p className="text-xs text-muted-foreground">بواسطة: {dispute.profiles?.full_name ?? "—"} · {format(new Date(dispute.created_at), "yyyy/MM/dd", { locale: ar })}</p>
        </div>
        <Badge className={disputeStatusColors[dispute.status]}>{disputeStatusLabels[dispute.status] ?? dispute.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{dispute.description}</p>

        <DisputeFinancialImpact projectId={dispute.project_id} />

        {/* Admin Escrow Actions */}
        <div className="flex flex-wrap gap-2 border-t pt-2">
          <p className="w-full text-xs font-medium text-muted-foreground mb-1">إجراءات مالية:</p>
          <Button size="sm" variant="outline" className="gap-1 text-xs" disabled={escrowLoading} onClick={() => handleEscrowAction("release")}>
            <Banknote className="h-3 w-3" /> تحرير الضمان
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs" disabled={escrowLoading} onClick={() => handleEscrowAction("refund")}>
            <ArrowDownCircle className="h-3 w-3" /> استرداد
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs" disabled={escrowLoading} onClick={() => handleEscrowAction("freeze")}>
            <Lock className="h-3 w-3" /> تجميد
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs" disabled={escrowLoading} onClick={() => handleEscrowAction("unfreeze")}>
            <Unlock className="h-3 w-3" /> إلغاء التجميد
          </Button>
        </div>

        {editing ? (
          <div className="space-y-3 border-t pt-3">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DisputeStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allDisputeStatuses.map(s => (
                  <SelectItem key={s} value={s}>{disputeStatusLabels[s]}</SelectItem>
                ))}
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

        <DisputeTimeline disputeId={dispute.id} />
        <DisputeResponseThread disputeId={dispute.id} disputeStatus={dispute.status} />
      </CardContent>
    </Card>
  );
}
