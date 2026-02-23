import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEarnings } from "@/hooks/useEarnings";
import { useWithdrawals, useCreateWithdrawal } from "@/hooks/useWithdrawals";
import { EarningsSummary } from "@/components/provider/EarningsSummary";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusLabels: Record<string, string> = { pending: "قيد المراجعة", approved: "تمت الموافقة", rejected: "مرفوض" };
const statusBorders: Record<string, string> = { pending: "border-r-4 border-yellow-500", approved: "border-r-4 border-emerald-500", rejected: "border-r-4 border-red-500" };
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-red-500/10 text-red-600",
};

export default function Earnings() {
  const { data: transactions, isLoading } = useEarnings();
  const { data: withdrawals, isLoading: loadingW } = useWithdrawals();
  const createWithdrawal = useCreateWithdrawal();
  const [showDialog, setShowDialog] = useState(false);
  const [amount, setAmount] = useState("");

  const totalEarnings = transactions
    ?.filter(t => t.status === "released")
    .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

  const handleWithdraw = () => {
    const num = Number(amount);
    if (!num || num <= 0) { toast.error("أدخل مبلغ صالح"); return; }
    if (num > totalEarnings) { toast.error("المبلغ أكبر من الرصيد المتاح"); return; }
    createWithdrawal.mutate(num, {
      onSuccess: () => { toast.success("تم إرسال طلب السحب"); setShowDialog(false); setAmount(""); },
      onError: () => toast.error("حدث خطأ"),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الأرباح</h1>
              <p className="text-sm text-muted-foreground">تابع أرباحك وطلبات السحب</p>
            </div>
          </div>
          {totalEarnings > 0 && (
            <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-l from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md">
              <Wallet className="h-4 w-4 ml-2" /> طلب سحب
            </Button>
          )}
        </div>
        <div className="h-1 w-20 rounded-full bg-gradient-to-l from-primary/60 to-primary" />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : !transactions?.length ? (
          <EmptyState icon={Receipt} title="لا توجد أرباح بعد" description="ستظهر أرباحك هنا بعد إتمام مشاريعك بنجاح" />
        ) : (
          <EarningsSummary totalEarnings={totalEarnings} transactions={transactions ?? []} />
        )}

        {/* Withdrawal requests */}
        {(withdrawals?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">طلبات السحب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withdrawals?.map((w: any) => (
                  <div key={w.id} className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${statusBorders[w.status] ?? ""}`}>
                    <div>
                      <p className="font-medium">{Number(w.amount).toLocaleString()} ر.س</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(w.created_at), "yyyy/MM/dd", { locale: ar })}</p>
                    </div>
                    <Badge className={statusColors[w.status]}>{statusLabels[w.status] ?? w.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>طلب سحب أرباح</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">الرصيد المتاح</p>
                <p className="text-2xl font-bold text-primary">{totalEarnings.toLocaleString()} ر.س</p>
              </div>
              <Input type="number" placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button onClick={handleWithdraw} disabled={createWithdrawal.isPending}>
                {createWithdrawal.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
