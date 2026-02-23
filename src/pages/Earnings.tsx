import { DashboardLayout } from "@/components/DashboardLayout";
import { useEarnings } from "@/hooks/useEarnings";
import { EarningsSummary } from "@/components/provider/EarningsSummary";

export default function Earnings() {
  const { data: transactions, isLoading } = useEarnings();

  const totalEarnings = transactions
    ?.filter(t => t.status === "released")
    .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">الأرباح</h1>
        {isLoading ? (
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        ) : (
          <EarningsSummary totalEarnings={totalEarnings} transactions={transactions ?? []} />
        )}
      </div>
    </DashboardLayout>
  );
}
