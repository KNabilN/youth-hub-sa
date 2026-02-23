import { DashboardLayout } from "@/components/DashboardLayout";
import { useEarnings } from "@/hooks/useEarnings";
import { EarningsSummary } from "@/components/provider/EarningsSummary";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt } from "lucide-react";

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
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-48" />
          </div>
        ) : !transactions?.length ? (
          <EmptyState icon={Receipt} title="لا توجد أرباح بعد" description="ستظهر أرباحك هنا بعد إتمام مشاريعك بنجاح" />
        ) : (
          <EarningsSummary totalEarnings={totalEarnings} transactions={transactions ?? []} />
        )}
      </div>
    </DashboardLayout>
  );
}
