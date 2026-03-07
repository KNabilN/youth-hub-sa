import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DisputeResponseThread } from "@/components/disputes/DisputeResponseThread";
import { DisputeFinancialImpact } from "@/components/disputes/DisputeFinancialImpact";
import { DisputeTimeline } from "@/components/disputes/DisputeTimeline";
import { useUpdateDispute } from "@/hooks/useAdminDisputes";
import { disputeStatusLabels, disputeStatusColors, allDisputeStatuses } from "@/lib/dispute-statuses";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowRight, Banknote, ArrowDownCircle, Lock, Unlock, Gavel, ExternalLink, Upload } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type DisputeStatus = Database["public"]["Enums"]["dispute_status"];

export default function AdminDisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const updateDispute = useUpdateDispute();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [escrowLoading, setEscrowLoading] = useState(false);

  // Escrow receipt dialog state
  const [escrowActionDialog, setEscrowActionDialog] = useState<{ action: "released" | "refunded"; escrow: any } | null>(null);
  const [escrowReceiptFile, setEscrowReceiptFile] = useState<File | null>(null);
  const [escrowUploading, setEscrowUploading] = useState(false);

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

  // Fetch escrow for this dispute's project
  const { data: escrow } = useQuery({
    queryKey: ["dispute-escrow", dispute?.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("project_id", dispute!.project_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!dispute?.project_id,
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

  // Release/Refund with receipt upload + auto invoice
  const handleEscrowWithReceipt = async () => {
    if (!escrowReceiptFile || !escrowActionDialog || !escrow) {
      toast.error("يرجى إرفاق ملف الإيصال");
      return;
    }
    setEscrowUploading(true);
    try {
      const { action, escrow: esc } = escrowActionDialog;

      // Upload receipt
      const filePath = `${esc.id}/${Date.now()}_${escrowReceiptFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("escrow-receipts").upload(filePath, escrowReceiptFile);
      if (uploadErr) throw uploadErr;

      // Optimistic lock: update only if status is held or frozen
      const fromStatuses = ["held", "frozen"];
      const { data: updated, error: updateErr } = await supabase
        .from("escrow_transactions")
        .update({ status: action, receipt_url: filePath })
        .eq("id", esc.id)
        .in("status", fromStatuses as any)
        .select("id");
      if (updateErr) throw updateErr;
      if (!updated?.length) {
        toast.error("تم تعديل حالة الضمان بالفعل من مكان آخر");
        setEscrowActionDialog(null);
        queryClient.invalidateQueries({ queryKey: ["dispute-escrow", dispute?.project_id] });
        return;
      }

      // Fetch commission rate
      const { data: config } = await supabase.from("commission_config").select("rate").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const rate = config?.rate ?? 0.05;
      const commissionAmount = Number(esc.amount) * Number(rate);

      // Generate invoice
      const now = new Date();
      const invoiceNumber = `INV-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const issuedTo = action === "released" ? esc.payee_id : esc.payer_id;
      const notesText = action === "released" ? "فاتورة تحرير ضمان مالي (شكوى)" : "فاتورة استرداد ضمان مالي (شكوى)";

      await supabase.from("invoices").insert({
        invoice_number: invoiceNumber,
        amount: Number(esc.amount),
        commission_amount: commissionAmount,
        issued_to: issuedTo,
        escrow_id: esc.id,
        notes: notesText,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["dispute-escrow", dispute?.project_id] });
      queryClient.invalidateQueries({ queryKey: ["admin-escrow"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["my-invoices"] });

      toast.success(action === "released" ? "تم تحرير الضمان وإصدار الفاتورة" : "تم استرداد الضمان وإصدار الفاتورة");
      setEscrowActionDialog(null);
      setEscrowReceiptFile(null);
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء العملية");
    } finally {
      setEscrowUploading(false);
    }
  };

  // Freeze/Unfreeze (no receipt needed)
  const handleEscrowAction = async (action: "freeze" | "unfreeze") => {
    if (!escrow) return;
    setEscrowLoading(true);
    try {
      const targetStatus = (action === "freeze" ? "frozen" : "held") as Database["public"]["Enums"]["escrow_status"];
      const fromStatus = (action === "freeze" ? "held" : "frozen") as Database["public"]["Enums"]["escrow_status"];

      const { data: updated, error } = await supabase
        .from("escrow_transactions")
        .update({ status: targetStatus })
        .eq("id", escrow.id)
        .eq("status", fromStatus)
        .select("id");
      if (error) throw error;
      if (!updated?.length) {
        toast.error("تم تعديل حالة الضمان بالفعل من مكان آخر");
      } else {
        toast.success(action === "freeze" ? "تم تجميد الضمان المالي" : "تم إلغاء تجميد الضمان المالي");
      }
      queryClient.invalidateQueries({ queryKey: ["dispute-escrow", dispute?.project_id] });
    } catch {
      toast.error("حدث خطأ أثناء تحديث الضمان");
    } finally {
      setEscrowLoading(false);
    }
  };

  // Determine which buttons to show based on escrow status
  const escrowStatus = escrow?.status;
  const showEscrowSection = !!escrow && escrowStatus !== "pending_payment" && escrowStatus !== "failed";
  const isEscrowFinal = escrowStatus === "released" || escrowStatus === "refunded";
  const canRelease = escrowStatus === "held" || escrowStatus === "frozen";
  const canRefund = escrowStatus === "held" || escrowStatus === "frozen";
  const canFreeze = escrowStatus === "held";
  const canUnfreeze = escrowStatus === "frozen";

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

  const escrowStatusLabels: Record<string, string> = {
    held: "محتجز", released: "محرر", frozen: "مجمد", refunded: "مسترد",
    pending_payment: "قيد الدفع", failed: "فشل", under_review: "قيد المراجعة",
  };

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
                  {(dispute as any).dispute_number && <span className="font-mono text-sm font-semibold text-primary">{(dispute as any).dispute_number}</span>}
                  <span>·</span>
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

        {/* Escrow Actions - conditional */}
        {showEscrowSection && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">إجراءات مالية</CardTitle>
                <Badge variant="outline" className="text-xs">
                  حالة الضمان: {escrowStatusLabels[escrowStatus ?? ""] ?? escrowStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isEscrowFinal ? (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
                  {escrowStatus === "released"
                    ? "✅ تم تحرير الضمان المالي وإصدار الفاتورة بنجاح"
                    : "✅ تم استرداد الضمان المالي وإصدار الفاتورة بنجاح"}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {canRelease && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 hover:bg-emerald-500/10" disabled={escrowLoading} onClick={() => { setEscrowActionDialog({ action: "released", escrow }); setEscrowReceiptFile(null); }}>
                      <Banknote className="h-4 w-4" /> تحرير الضمان
                    </Button>
                  )}
                  {canRefund && (
                    <Button size="sm" variant="outline" className="gap-1.5" disabled={escrowLoading} onClick={() => { setEscrowActionDialog({ action: "refunded", escrow }); setEscrowReceiptFile(null); }}>
                      <ArrowDownCircle className="h-4 w-4" /> استرداد
                    </Button>
                  )}
                  {canFreeze && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 hover:bg-blue-500/10" disabled={escrowLoading} onClick={() => handleEscrowAction("freeze")}>
                      <Lock className="h-4 w-4" /> تجميد
                    </Button>
                  )}
                  {canUnfreeze && (
                    <Button size="sm" variant="outline" className="gap-1.5" disabled={escrowLoading} onClick={() => handleEscrowAction("unfreeze")}>
                      <Unlock className="h-4 w-4" /> إلغاء التجميد
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <DisputeTimeline disputeId={dispute.id} />

        {/* Response Thread */}
        <DisputeResponseThread disputeId={dispute.id} disputeStatus={dispute.status} />
      </div>

      {/* Receipt Upload Dialog for Release/Refund */}
      <Dialog open={!!escrowActionDialog} onOpenChange={(open) => { if (!open) { setEscrowActionDialog(null); setEscrowReceiptFile(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {escrowActionDialog?.action === "released" ? "تحرير الضمان المالي" : "استرداد الضمان المالي"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {escrowActionDialog?.action === "released"
                ? "سيتم تحرير المبلغ لمزود الخدمة. يرجى إرفاق إيصال التحويل البنكي."
                : "سيتم استرداد المبلغ للجمعية. يرجى إرفاق إيصال التحويل البنكي."}
            </p>
            {escrowActionDialog?.escrow && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="font-medium">المبلغ:</span> {Number(escrowActionDialog.escrow.amount).toLocaleString("ar-SA")} ر.س</p>
                <p><span className="font-medium">رقم الضمان:</span> {escrowActionDialog.escrow.escrow_number}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>إيصال التحويل البنكي *</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => document.getElementById("escrow-receipt-input")?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {escrowReceiptFile ? escrowReceiptFile.name : "اختر ملف"}
                </Button>
                <input
                  id="escrow-receipt-input"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setEscrowReceiptFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setEscrowActionDialog(null); setEscrowReceiptFile(null); }}>إلغاء</Button>
            <Button onClick={handleEscrowWithReceipt} disabled={!escrowReceiptFile || escrowUploading}>
              {escrowUploading ? "جاري التنفيذ..." : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
