import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEarnings } from "@/hooks/useEarnings";
import { useWithdrawals, useCreateWithdrawal } from "@/hooks/useWithdrawals";
import { EarningsSummary } from "@/components/provider/EarningsSummary";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Receipt, Wallet, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const statusLabels: Record<string, string> = { pending: "قيد المراجعة", approved: "تمت الموافقة", rejected: "مرفوض", processed: "تم التحويل" };
const statusBorders: Record<string, string> = { pending: "border-e-4 border-yellow-500", approved: "border-e-4 border-emerald-500", rejected: "border-e-4 border-red-500", processed: "border-e-4 border-blue-500" };
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-red-500/10 text-red-600",
  processed: "bg-blue-500/10 text-blue-600"
};

export default function Earnings() {
  const { data: transactions, isLoading } = useEarnings();
  const { data: withdrawals, isLoading: loadingW } = useWithdrawals();
  const createWithdrawal = useCreateWithdrawal();
  const [confirmData, setConfirmData] = useState<{ escrowId: string; amount: number; projectTitle: string } | null>(null);

  const totalEarnings = transactions?.
    filter((t) => t.status === "released").
    reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

  const approvedWithdrawals = withdrawals?.
    filter((w: any) => w.status === "approved" || w.status === "processed").
    reduce((sum: number, w: any) => sum + Number(w.amount), 0) ?? 0;

  const availableBalance = totalEarnings - approvedWithdrawals;

  // Set of escrow IDs that already have a withdrawal request (any status except rejected)
  const withdrawnEscrowIds = new Set<string>(
    (withdrawals ?? [])
      .filter((w: any) => w.escrow_id && w.status !== "rejected")
      .map((w: any) => w.escrow_id)
  );

  const handleWithdraw = () => {
    if (!confirmData) return;
    createWithdrawal.mutate({ amount: confirmData.amount, escrow_id: confirmData.escrowId }, {
      onSuccess: () => { toast.success("تم إرسال طلب السحب"); setConfirmData(null); },
      onError: () => toast.error("حدث خطأ")
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">المعاملات المادية</h1>
            <p className="text-sm text-muted-foreground">تابع أرباحك وطلبات السحب</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {isLoading ?
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div> :
          !transactions?.length ?
            <EmptyState icon={Receipt} title="لا توجد أرباح بعد" description="ستظهر أرباحك هنا بعد إتمام مشاريعك بنجاح" /> :
            <EarningsSummary
              totalEarnings={totalEarnings}
              availableBalance={availableBalance}
              transactions={transactions ?? []}
              withdrawnEscrowIds={withdrawnEscrowIds}
              onWithdraw={(escrowId, amount, projectTitle) => setConfirmData({ escrowId, amount, projectTitle })}
            />
        }

        {/* Withdrawal requests */}
        {(withdrawals?.length ?? 0) > 0 &&
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">طلبات السحب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withdrawals?.map((w: any) =>
                  <div key={w.id} className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${statusBorders[w.status] ?? ""}`}>
                    <div>
                      {w.withdrawal_number && <p className="text-xs font-mono text-muted-foreground mb-0.5">{w.withdrawal_number}</p>}
                      <p className="font-medium">{Number(w.amount).toLocaleString()} ر.س</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(w.created_at), "yyyy/MM/dd", { locale: ar })}</p>
                      {w.status === "rejected" && w.rejection_reason && (
                        <div className="flex items-start gap-1 mt-1.5 p-2 rounded bg-destructive/5 border border-destructive/20">
                          <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                          <p className="text-xs text-destructive">{w.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(w.status === "approved" || w.status === "processed") && w.receipt_url && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
                          const { data } = await supabase.storage.from("withdrawal-receipts").createSignedUrl(w.receipt_url, 300);
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          else toast.error("تعذر فتح الإيصال");
                        }}>
                          <Download className="h-3 w-3 me-1" />الإيصال
                        </Button>
                      )}
                      <Badge className={statusColors[w.status]}>{statusLabels[w.status] ?? w.status}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        }

        {/* Confirm withdrawal dialog */}
        <Dialog open={!!confirmData} onOpenChange={(open) => !open && setConfirmData(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد طلب السحب</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                <p className="text-sm text-muted-foreground">المشروع</p>
                <p className="font-semibold">{confirmData?.projectTitle}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                <p className="text-sm text-muted-foreground">المبلغ</p>
                <p className="text-2xl font-bold text-primary">{confirmData?.amount.toLocaleString()} ر.س</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmData(null)}>إلغاء</Button>
              <Button onClick={handleWithdraw} disabled={createWithdrawal.isPending}>
                {createWithdrawal.isPending ? "جارٍ الإرسال..." : "تأكيد طلب السحب"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
