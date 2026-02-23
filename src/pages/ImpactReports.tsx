import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorStats } from "@/hooks/useDonorStats";
import { useDonorContributions } from "@/hooks/useDonorContributions";
import { ImpactSummary } from "@/components/donor/ImpactSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
              <p className="text-muted-foreground text-sm">جاري التحميل...</p>
            ) : !contributions?.length ? (
              <p className="text-muted-foreground text-sm">لا توجد تبرعات لعرض تأثيرها</p>
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
