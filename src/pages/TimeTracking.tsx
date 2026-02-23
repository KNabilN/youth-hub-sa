import { DashboardLayout } from "@/components/DashboardLayout";
import { useProviderTimeLogs, useAssignedProjects, useCreateTimeLog } from "@/hooks/useProviderTimeLogs";
import { TimeEntryForm, type TimeEntryFormValues } from "@/components/provider/TimeEntryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const approvalLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "قيد المراجعة", variant: "secondary" },
  approved: { label: "معتمد", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
};

export default function TimeTracking() {
  const { data: timeLogs, isLoading } = useProviderTimeLogs();
  const { data: projects } = useAssignedProjects();
  const createTimeLog = useCreateTimeLog();
  const { toast } = useToast();

  const handleSubmit = (values: TimeEntryFormValues) => {
    createTimeLog.mutate({ project_id: values.project_id, log_date: values.log_date, hours: values.hours, description: values.description }, {
      onSuccess: () => toast({ title: "تم تسجيل الساعات بنجاح" }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">تسجيل الساعات</h1>

        <Card>
          <CardHeader><CardTitle className="text-lg">تسجيل ساعات جديدة</CardTitle></CardHeader>
          <CardContent>
            {!projects?.length ? (
              <p className="text-sm text-muted-foreground">لا توجد مشاريع مسندة إليك حالياً</p>
            ) : (
              <TimeEntryForm projects={projects} onSubmit={handleSubmit} isLoading={createTimeLog.isPending} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">سجل الساعات</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
            ) : !timeLogs?.length ? (
              <p className="text-sm text-muted-foreground">لا توجد ساعات مسجلة</p>
            ) : (
              <div className="space-y-3">
                {timeLogs.map(log => {
                  const st = approvalLabels[log.approval] ?? approvalLabels.pending;
                  return (
                    <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{log.projects?.title ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{log.log_date} • {log.hours} ساعة</p>
                        {log.description && <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>}
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
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
