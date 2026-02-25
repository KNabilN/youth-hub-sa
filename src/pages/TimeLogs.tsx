import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAssociationTimeLogs, useUpdateTimeLogApproval } from "@/hooks/useTimeLogs";
import { TimeLogTable } from "@/components/time-logs/TimeLogTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Clock, CheckCircle } from "lucide-react";

export default function TimeLogs() {
  const [filter, setFilter] = useState("all");
  const { data: logs, isLoading } = useAssociationTimeLogs(filter);
  const updateApproval = useUpdateTimeLogApproval();

  const pendingHours = logs?.filter(l => l.approval === "pending").reduce((s, l) => s + Number(l.hours), 0) ?? 0;
  const approvedHours = logs?.filter(l => l.approval === "approved").reduce((s, l) => s + Number(l.hours), 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Clock className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سجل الساعات</h1>
            <p className="text-sm text-muted-foreground">مراجعة واعتماد ساعات العمل</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-warning" />
            <div><p className="text-sm text-muted-foreground">ساعات قيد المراجعة</p><p className="text-2xl font-bold">{pendingHours}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div><p className="text-sm text-muted-foreground">ساعات معتمدة</p><p className="text-2xl font-bold">{approvedHours}</p></div>
          </CardContent></Card>
        </div>

        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm font-medium text-muted-foreground">تصفية حسب الحالة</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? <Skeleton className="h-64" /> : (
          <TimeLogTable
            logs={(logs as any) ?? []}
            onApprove={(id) => {
              const log = ((logs as any) ?? []).find((l: any) => l.id === id);
              updateApproval.mutate({ id, approval: "approved", providerId: log?.provider_id ?? "" }, { onSuccess: () => toast({ title: "تم اعتماد السجل" }) });
            }}
            onReject={(id, reason) => {
              const log = ((logs as any) ?? []).find((l: any) => l.id === id);
              updateApproval.mutate({ id, approval: "rejected", providerId: log?.provider_id ?? "", rejectionReason: reason }, { onSuccess: () => toast({ title: "تم رفض السجل" }) });
            }}
            isLoading={updateApproval.isPending}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
