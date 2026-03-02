import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; border: string }> = {
  held: { label: "محتجز", variant: "secondary", border: "border-e-4 border-yellow-500" },
  released: { label: "صُرف", variant: "default", border: "border-e-4 border-emerald-500" },
  frozen: { label: "مجمّد", variant: "outline", border: "border-e-4 border-blue-500" },
  refunded: { label: "مسترد", variant: "destructive", border: "border-e-4 border-red-500" },
};

interface EarningsSummaryProps {
  totalEarnings: number;
  transactions: {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    projects?: { title: string; request_number?: string; categories?: { name: string } | null; regions?: { name: string } | null } | null;
    payer?: { full_name: string; organization_name?: string | null } | null;
  }[];
}

export function EarningsSummary({ totalEarnings, transactions }: EarningsSummaryProps) {
  return (
    <div className="space-y-4">
      <Card className="border-e-4 border-primary bg-gradient-to-l from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">إجمالي الأرباح المصروفة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{totalEarnings.toLocaleString()} ر.س</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سجل المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد معاملات حتى الآن</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => {
                const st = statusLabels[tx.status] ?? statusLabels.held;
                const associationName = tx.payer?.organization_name || tx.payer?.full_name;
                const categoryName = tx.projects?.categories?.name;
                const regionName = tx.projects?.regions?.name;
                const requestNumber = tx.projects?.request_number;

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
                        <span className="text-sm font-semibold text-primary">{tx.amount} ر.س</span>
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
