import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorStats, useDonorFundConsumption } from "@/hooks/useDonorStats";
import { useDonorContributions } from "@/hooks/useDonorContributions";
import { ImpactSummary } from "@/components/donor/ImpactSummary";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

const statusLabels: Record<string, string> = {
  draft: "مسودة", open: "مفتوح", in_progress: "قيد التنفيذ",
  completed: "مكتمل", disputed: "متنازع", cancelled: "ملغي", pending_approval: "بانتظار الموافقة",
};

export default function ImpactReports() {
  const { data: stats, isLoading: statsLoading } = useDonorStats();
  const { data: contributions, isLoading: contribLoading } = useDonorContributions();
  const { data: fundConsumption, isLoading: fundLoading } = useDonorFundConsumption();

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
              <p className="text-2xl font-bold text-emerald-600">
                {fundLoading ? "..." : (fundConsumption?.completedFunds ?? 0).toLocaleString()} ر.س
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">تفاصيل التبرعات</CardTitle></CardHeader>
          <CardContent>
            {contribLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !contributions?.length ? (
              <EmptyState icon={BarChart3} title="لا توجد تبرعات لعرض تأثيرها" description="قدّم تبرعاً لتتبع أثره على المجتمع" actionLabel="صفحة التبرعات" actionHref="/donations" />
            ) : (
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المشروع / الخدمة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>النوع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{(c.projects as any)?.title || (c.micro_services as any)?.title || "-"}</TableCell>
                      <TableCell>{Number(c.amount).toLocaleString()} ر.س</TableCell>
                      <TableCell>
                        {c.project_id && (c.projects as any)?.status ? (
                          <Badge variant="outline">{statusLabels[(c.projects as any).status] || (c.projects as any).status}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.project_id ? "مشروع" : "خدمة"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
