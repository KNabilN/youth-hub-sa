import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorStats } from "@/hooks/useDonorStats";
import { useDonorContributions } from "@/hooks/useDonorContributions";
import { ImpactSummary } from "@/components/donor/ImpactSummary";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export default function ImpactReports() {
  const { data: stats, isLoading: statsLoading } = useDonorStats();
  const { data: contributions, isLoading: contribLoading } = useDonorContributions();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">تقارير الأثر</h1>
          <p className="text-muted-foreground text-sm mt-1">تأثير تبرعاتك على المجتمع</p>
        </div>

        <ImpactSummary
          totalDonations={stats?.totalDonations ?? 0}
          projectsFunded={stats?.projectsFunded ?? 0}
          associationsSupported={stats?.associationsSupported ?? 0}
          isLoading={statsLoading}
        />

        <Card>
          <CardHeader><CardTitle className="text-lg">تفاصيل التبرعات</CardTitle></CardHeader>
          <CardContent>
            {contribLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !contributions?.length ? (
              <EmptyState icon={BarChart3} title="لا توجد تبرعات لعرض تأثيرها" description="قدّم تبرعاً لتتبع أثره على المجتمع" actionLabel="صفحة التبرعات" actionHref="/donations" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المشروع / الخدمة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>النوع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{(c.projects as any)?.title || (c.micro_services as any)?.title || "-"}</TableCell>
                      <TableCell>{Number(c.amount).toLocaleString()} ر.س</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.project_id ? "مشروع" : "خدمة"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
