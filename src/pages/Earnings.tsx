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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">الأرباح</h1>
          {totalEarnings > 0 && (
            <Button onClick={() => setShowDialog(true)}>
              <Wallet className="h-4 w-4 ml-2" /> طلب سحب
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-48" />
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
              <div className="space-y-3">
                {withdrawals?.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between p-3 border rounded-lg">
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
              <p className="text-sm text-muted-foreground">الرصيد المتاح: <span className="font-bold text-foreground">{totalEarnings.toLocaleString()} ر.س</span></p>
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
