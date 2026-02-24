import { DashboardLayout } from "@/components/DashboardLayout";
import { useProviderTimeLogs, useAssignedProjects, useCreateTimeLog } from "@/hooks/useProviderTimeLogs";
import { TimeEntryForm, type TimeEntryFormValues } from "@/components/provider/TimeEntryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Clock, CheckCircle2, Timer } from "lucide-react";

const approvalLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; border: string }> = {
  pending: { label: "قيد المراجعة", variant: "secondary", border: "border-r-4 border-yellow-500" },
  approved: { label: "معتمد", variant: "default", border: "border-r-4 border-emerald-500" },
  rejected: { label: "مرفوض", variant: "destructive", border: "border-r-4 border-red-500" },
};

export default function TimeTracking() {
  const { data: timeLogs, isLoading } = useProviderTimeLogs();
  const { data: projects } = useAssignedProjects();
  const createTimeLog = useCreateTimeLog();
  const { toast } = useToast();

  const totalHours = timeLogs?.reduce((s, l) => s + Number(l.hours), 0) ?? 0;
  const approvedHours = timeLogs?.filter(l => l.approval === "approved").reduce((s, l) => s + Number(l.hours), 0) ?? 0;
  const pendingHours = timeLogs?.filter(l => l.approval === "pending").reduce((s, l) => s + Number(l.hours), 0) ?? 0;

  const handleSubmit = (values: TimeEntryFormValues) => {
    createTimeLog.mutate({ project_id: values.project_id, log_date: values.log_date, hours: values.hours, description: values.description }, {
      onSuccess: () => toast({ title: "تم تسجيل الساعات بنجاح" }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const miniStats = [
    { label: "إجمالي الساعات", value: totalHours, icon: Clock, bg: "bg-primary/10", text: "text-primary" },
    { label: "ساعات معتمدة", value: approvedHours, icon: CheckCircle2, bg: "bg-emerald-500/10", text: "text-emerald-600" },
    { label: "ساعات قيد المراجعة", value: pendingHours, icon: Timer, bg: "bg-yellow-500/10", text: "text-yellow-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Clock className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تسجيل الساعات</h1>
            <p className="text-sm text-muted-foreground">سجّل ساعات عملك على المشاريع المسندة إليك</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Summary Stats */}
        {!isLoading && (timeLogs?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {miniStats.map((s, i) => (
              <Card key={i} className="card-hover">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`p-2.5 rounded-lg ${s.bg}`}>
                    <s.icon className={`h-5 w-5 ${s.text}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* New Entry */}
        <Card className="border-r-4 border-primary">
          <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent rounded-t-lg">
            <CardTitle className="text-lg">تسجيل ساعات جديدة</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!projects?.length ? (
              <p className="text-sm text-muted-foreground">لا توجد مشاريع مسندة إليك حالياً</p>
            ) : (
              <TimeEntryForm projects={projects} onSubmit={handleSubmit} isLoading={createTimeLog.isPending} />
            )}
          </CardContent>
        </Card>

        {/* Time Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سجل الساعات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : !timeLogs?.length ? (
              <EmptyState icon={ClipboardList} title="لا توجد ساعات مسجلة" description="سجل ساعات عملك على المشاريع المسندة إليك" />
            ) : (
              <div className="space-y-2">
                {timeLogs.map(log => {
                  const st = approvalLabels[log.approval] ?? approvalLabels.pending;
                  return (
                    <div key={log.id} className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${st.border}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{log.projects?.title ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{log.log_date} • {log.hours} ساعة</p>
                        {log.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{log.description}</p>}
                      </div>
                      <Badge variant={st.variant} className="shrink-0 mr-3">{st.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
