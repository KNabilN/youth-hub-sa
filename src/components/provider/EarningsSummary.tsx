import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Wallet, ArrowDownToLine } from "lucide-react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; border: string }> = {
  held: { label: "محتجز", variant: "secondary", border: "border-e-4 border-amber-500" },
  released: { label: "صُرف", variant: "default", border: "border-e-4 border-emerald-500" },
  frozen: { label: "مجمّد", variant: "outline", border: "border-e-4 border-blue-500" },
  refunded: { label: "مسترد", variant: "destructive", border: "border-e-4 border-red-500" },
};

interface EarningsSummaryProps {
  totalEarnings: number;
  availableBalance: number;
  transactions: {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    projects?: { title: string; request_number?: string; categories?: { name: string } | null; regions?: { name: string } | null } | null;
    payer?: { full_name: string; organization_name?: string | null } | null;
  }[];
  withdrawnEscrowIds: Set<string>;
  onWithdraw: (escrowId: string, amount: number, projectTitle: string) => void;
}

export function EarningsSummary({ totalEarnings, availableBalance, transactions, withdrawnEscrowIds, onWithdraw }: EarningsSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-e-4 border-primary bg-gradient-to-l from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              إجمالي الأرباح المصروفة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalEarnings.toLocaleString()} ر.س</div>
          </CardContent>
        </Card>

        <Card className="border-e-4 border-amber-500 bg-gradient-to-l from-amber-500/5 to-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-4 w-4" />
              الرصيد المتاح للسحب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{availableBalance.toLocaleString()} ر.س</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">سجل المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد معاملات حتى الآن</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => {
                const st = statusLabels[tx.status] ?? statusLabels.held;
                const associationName = tx.payer?.organization_name || tx.payer?.full_name;
                const categoryName = tx.projects?.categories?.name;
                const regionName = tx.projects?.regions?.name;
                const requestNumber = tx.projects?.request_number;
                const canWithdraw = tx.status === "released" && !withdrawnEscrowIds.has(tx.id);

                return (
                  <div key={tx.id} className={`p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${st.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {requestNumber && (
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{requestNumber}</span>
                          )}
                          <p className="text-sm font-semibold truncate">{tx.projects?.title ?? "—"}</p>
                        </div>
                        {associationName && (
                          <p className="text-xs text-muted-foreground">{associationName}</p>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {categoryName && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{categoryName}</Badge>
                          )}
                          {regionName && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{regionName}</Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("ar-SA")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <span className="text-sm font-semibold text-primary">{Number(tx.amount).toLocaleString()} ر.س</span>
                        {canWithdraw && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs mt-1"
                            onClick={() => onWithdraw(tx.id, Number(tx.amount), tx.projects?.title ?? "—")}
                          >
                            <ArrowDownToLine className="h-3 w-3 me-1" />
                            طلب سحب
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
