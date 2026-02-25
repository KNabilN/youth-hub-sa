import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorStats, useDonorFundConsumption, useDonorBalances } from "@/hooks/useDonorStats";
import { useDonorContributions } from "@/hooks/useDonorContributions";
import { ImpactSummary } from "@/components/donor/ImpactSummary";
import { DonorBalanceCards } from "@/components/donor/DonorBalanceCards";
import { DonationTimeline } from "@/components/donor/DonationTimeline";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ImpactReports() {
  const { data: stats, isLoading: statsLoading } = useDonorStats();
  const { data: contributions, isLoading: contribLoading } = useDonorContributions();
  const { data: fundConsumption, isLoading: fundLoading } = useDonorFundConsumption();
  const { data: balances, isLoading: balancesLoading } = useDonorBalances();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تقارير الأثر</h1>
            <p className="text-sm text-muted-foreground">تأثير تبرعاتك على المجتمع</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <ImpactSummary
          totalDonations={stats?.totalDonations ?? 0}
          projectsFunded={stats?.projectsFunded ?? 0}
          associationsSupported={stats?.associationsSupported ?? 0}
          isLoading={statsLoading}
        />

        {/* Balance Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-3">أرصدة الدعم</h2>
          <DonorBalanceCards
            available={balances?.available ?? 0}
            reserved={balances?.reserved ?? 0}
            consumed={balances?.consumed ?? 0}
            suspended={balances?.suspended ?? 0}
            expired={balances?.expired ?? 0}
            isLoading={balancesLoading}
          />
        </div>

        {/* Fund Consumption */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">أموال في مشاريع نشطة</p>
              <p className="text-2xl font-bold text-primary">
                {fundLoading ? "..." : (fundConsumption?.activeFunds ?? 0).toLocaleString()} ر.س
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">أموال في مشاريع مكتملة</p>
              <p className="text-2xl font-bold text-success">
                {fundLoading ? "..." : (fundConsumption?.completedFunds ?? 0).toLocaleString()} ر.س
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-lg">سجل التبرعات الزمني</CardTitle></CardHeader>
          <CardContent>
            {contribLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !contributions?.length ? (
              <EmptyState icon={BarChart3} title="لا توجد تبرعات لعرض تأثيرها" description="قدّم تبرعاً لتتبع أثره على المجتمع" actionLabel="صفحة التبرعات" actionHref="/donations" />
            ) : (
              <DonationTimeline contributions={contributions as any} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
