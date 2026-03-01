import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DisputeResponseThread } from "@/components/disputes/DisputeResponseThread";
import { DisputeFinancialImpact } from "@/components/disputes/DisputeFinancialImpact";
import { DisputeTimeline } from "@/components/disputes/DisputeTimeline";
import { useUpdateDispute } from "@/hooks/useAdminDisputes";
import { disputeStatusLabels, disputeStatusColors, allDisputeStatuses } from "@/lib/dispute-statuses";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowRight, Banknote, ArrowDownCircle, Lock, Unlock, Gavel, ExternalLink } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type DisputeStatus = Database["public"]["Enums"]["dispute_status"];

export default function AdminDisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const updateDispute = useUpdateDispute();
  const [editing, setEditing] = useState(false);
  const [escrowLoading, setEscrowLoading] = useState(false);

  const { data: dispute, isLoading } = useQuery({
    queryKey: ["admin-dispute", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*, projects(title), profiles!disputes_raised_by_fkey(full_name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [newStatus, setNewStatus] = useState<DisputeStatus>("open");
  const [notes, setNotes] = useState("");

  // Sync state when dispute loads
  if (dispute && newStatus === "open" && !editing) {
    if (dispute.status !== newStatus) setNewStatus(dispute.status);
    if ((dispute.resolution_notes || "") !== notes) setNotes(dispute.resolution_notes || "");
  }

  const handleSave = () => {
    if (!id) return;
    updateDispute.mutate({ id, status: newStatus, resolution_notes: notes }, {
      onSuccess: () => { toast.success("تم تحديث الشكوى"); setEditing(false); },
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const handleEscrowAction = async (action: "release" | "refund" | "freeze" | "unfreeze") => {
    if (!dispute) return;
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!dispute) {
    return (
      <DashboardLayout>
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">الشكوى غير موجودة</p>
          <Button asChild variant="outline"><Link to="/admin/disputes">العودة للقائمة</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/disputes" className="gap-1.5">
              <ArrowRight className="h-4 w-4" />
              العودة
            </Link>
          </Button>
          <div className="flex-1" />
          <Badge className={disputeStatusColors[dispute.status]}>{disputeStatusLabels[dispute.status] ?? dispute.status}</Badge>
        </div>

        {/* Main Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">شكوى على مشروع: {dispute.projects?.title ?? "غير معروف"}</CardTitle>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>بواسطة: {dispute.profiles?.full_name ?? "—"}</span>
                  <span>·</span>
                  <span>{format(new Date(dispute.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to={`/admin/projects/${dispute.project_id}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  عرض المشروع
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">الوصف</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{dispute.description}</p>
            </div>

            {dispute.resolution_notes && !editing && (
              <div>
                <h4 className="text-sm font-medium mb-1">ملاحظات الحل</h4>
                <p className="text-sm text-muted-foreground">{dispute.resolution_notes}</p>
              </div>
            )}

            {/* Status editing */}
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
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>تعديل الحالة</Button>
            )}
          </CardContent>
        </Card>

        {/* Financial Impact */}
        <DisputeFinancialImpact projectId={dispute.project_id} />

        {/* Escrow Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">إجراءات مالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" disabled={escrowLoading} onClick={() => handleEscrowAction("release")}>
                <Banknote className="h-4 w-4" /> تحرير الضمان
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" disabled={escrowLoading} onClick={() => handleEscrowAction("refund")}>
                <ArrowDownCircle className="h-4 w-4" /> استرداد
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" disabled={escrowLoading} onClick={() => handleEscrowAction("freeze")}>
                <Lock className="h-4 w-4" /> تجميد
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" disabled={escrowLoading} onClick={() => handleEscrowAction("unfreeze")}>
                <Unlock className="h-4 w-4" /> إلغاء التجميد
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <DisputeTimeline disputeId={dispute.id} />

        {/* Response Thread */}
        <DisputeResponseThread disputeId={dispute.id} disputeStatus={dispute.status} />
      </div>
    </DashboardLayout>
  );
}
