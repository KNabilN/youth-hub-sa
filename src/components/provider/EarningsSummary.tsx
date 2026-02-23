import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  held: { label: "محتجز", variant: "secondary" },
  released: { label: "صُرف", variant: "default" },
  frozen: { label: "مجمّد", variant: "outline" },
  refunded: { label: "مسترد", variant: "destructive" },
};

interface EarningsSummaryProps {
  totalEarnings: number;
  transactions: {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    projects?: { title: string } | null;
  }[];
}

export function EarningsSummary({ totalEarnings, transactions }: EarningsSummaryProps) {
  return (
    <div className="space-y-4">
      <Card>
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
                return (
                  <div key={tx.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{tx.projects?.title ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("ar-SA")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <span className="text-sm font-semibold">{tx.amount} ر.س</span>
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
