import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorStats } from "@/hooks/useDonorStats";
import { useImpactReports } from "@/hooks/useImpactReports";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, FileText, HandCoins, Users, Download, Calendar, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

function SummaryCards({
  totalDonations,
  associationsSupported,
  reportsCount,
  isLoading,
}: {
  totalDonations: number;
  associationsSupported: number;
  reportsCount: number;
  isLoading: boolean;
}) {
  const items = [
    { title: "إجمالي المنح", value: `${totalDonations.toLocaleString()} ر.س`, icon: HandCoins, color: "primary" },
    { title: "الجمعيات المدعومة", value: associationsSupported, icon: Users, color: "info" },
    { title: "تقارير الأثر", value: reportsCount, icon: FileText, color: "success" },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", border: "border-s-primary" },
    info: { bg: "bg-info/10", text: "text-info", border: "border-s-info" },
    success: { bg: "bg-success/10", text: "text-success", border: "border-s-success" },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((stat) => {
        const c = colorMap[stat.color];
        return (
          <Card key={stat.title} className={`border-s-4 ${c.border}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {isLoading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${c.bg}`}>
                  <stat.icon className={`h-5 w-5 ${c.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function handleDownload(filePath: string, fileName: string) {
  const { data } = supabase.storage.from("impact-reports").getPublicUrl(filePath);
  // For private buckets, use createSignedUrl
  supabase.storage
    .from("impact-reports")
    .createSignedUrl(filePath, 60 * 5) // 5 min
    .then(({ data: signedData }) => {
      if (signedData?.signedUrl) {
        window.open(signedData.signedUrl, "_blank");
      }
    });
}

export default function ImpactReports() {
  const { data: stats, isLoading: statsLoading } = useDonorStats();
  const { data: reports, isLoading: reportsLoading } = useImpactReports();
  const [assocFilter, setAssocFilter] = useState("all");

  const isLoading = statsLoading || reportsLoading;

  // Build unique associations list for filter
  const associations = useMemo(() => {
    if (!reports?.length) return [];
    const map = new Map<string, string>();
    reports.forEach(r => {
      if (r.association) {
        map.set(r.association_id, r.association.organization_name || r.association.full_name || "جمعية");
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (assocFilter === "all") return reports;
    return reports.filter(r => r.association_id === assocFilter);
  }, [reports, assocFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تقارير الأثر</h1>
            <p className="text-sm text-muted-foreground">
              تقارير أثر المنح المقدمة من الجمعيات المستفيدة
            </p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Summary */}
        <SummaryCards
          totalDonations={stats?.totalDonations ?? 0}
          associationsSupported={stats?.associationsSupported ?? 0}
          reportsCount={filteredReports.length}
          isLoading={isLoading}
        />

        {/* Filter + Reports List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">التقارير المرفوعة</h2>
            {associations.length > 1 && (
              <Select value={assocFilter} onValueChange={setAssocFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="فلتر حسب الجمعية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الجمعيات</SelectItem>
                  {associations.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {reportsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          ) : !reports?.length ? (
            <EmptyState
              icon={FileText}
              title="لا توجد تقارير أثر بعد"
              description="ستظهر هنا تقارير الأثر التي ترفعها الجمعيات المستفيدة من منحك"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="group hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Association avatar */}
                      <Avatar className="h-12 w-12 shrink-0 border">
                        <AvatarImage
                          src={
                            report.association?.company_logo_url ||
                            report.association?.avatar_url ||
                            ""
                          }
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {(
                            report.association?.organization_name ||
                            report.association?.full_name ||
                            "?"
                          ).charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title */}
                        <h3 className="font-semibold text-base leading-tight line-clamp-1">
                          {report.title || report.file_name}
                        </h3>

                        {/* Association name */}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {report.association?.organization_name ||
                              report.association?.full_name ||
                              "جمعية"}
                          </span>
                        </div>

                        {/* Description */}
                        {report.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.description}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center flex-wrap gap-2">
                          {report.project && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              {report.project.title}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(report.created_at), "d MMMM yyyy", {
                              locale: ar,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Download button */}
                      <Button
                        size="icon"
                        variant="outline"
                        className="shrink-0 mt-1"
                        onClick={() => handleDownload(report.file_path, report.file_name)}
                        title="عرض / تحميل التقرير"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
