import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminNotifications, useAdminNotificationStats, useResendNotification } from "@/hooks/useAdminNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Bell, Send, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { notificationTypeLabels, getNotificationLabel } from "@/lib/notification-type-labels";

const statusMap: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  delivered: { label: "تم التوصيل", icon: CheckCircle, className: "bg-success/15 text-success border-success/30" },
  failed: { label: "فشل", icon: XCircle, className: "bg-destructive/15 text-destructive border-destructive/30" },
  pending: { label: "قيد الإرسال", icon: Clock, className: "bg-warning/15 text-warning border-warning/30" },
};

export default function AdminNotifications() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: notifications, isLoading } = useAdminNotifications(filter, typeFilter, page);
  const { data: stats } = useAdminNotificationStats();
  const resend = useResendNotification();

  const handleResend = (n: any) => {
    resend.mutate(
      { user_id: n.user_id, message: n.message, type: n.type },
      { onSuccess: () => toast({ title: "تم إعادة إرسال الإشعار" }) }
    );
  };

  const statCards = [
    { label: "إجمالي الإشعارات", value: stats?.total ?? 0, icon: Bell, bg: "bg-primary/10", text: "text-primary" },
    { label: "تم التوصيل", value: stats?.delivered ?? 0, icon: CheckCircle, bg: "bg-emerald-500/10", text: "text-emerald-600" },
    { label: "قيد الإرسال", value: stats?.pending ?? 0, icon: Clock, bg: "bg-warning/10", text: "text-warning" },
    { label: "فشل", value: stats?.failed ?? 0, icon: XCircle, bg: "bg-destructive/10", text: "text-destructive" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Bell className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة الإشعارات</h1>
            <p className="text-sm text-muted-foreground">مراقبة وإعادة إرسال الإشعارات</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((s, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`p-2.5 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.text}`} /></div>
                <div>
                  <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-end mb-5 bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">حالة التوصيل</Label>
            <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[180px] h-9 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="delivered">تم التوصيل</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
                <SelectItem value="pending">قيد الإرسال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">النوع</Label>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[200px] h-9 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(notificationTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-3" />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground hover:text-foreground"
            onClick={() => { setFilter("all"); setTypeFilter("all"); setPage(0); }}
          >
            <RotateCcw className="h-3.5 w-3.5 me-1" />إعادة تعيين
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">سجل الإشعارات</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !notifications?.length ? (
              <EmptyState icon={Bell} title="لا توجد إشعارات" description="لم يتم إرسال أي إشعارات بعد" />
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>الرسالة</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((n: any) => {
                        const st = statusMap[n.delivery_status] || statusMap.delivered;
                        const StIcon = st.icon;
                        return (
                          <TableRow key={n.id}>
                            <TableCell className="font-medium text-sm">{n.profiles?.full_name || "—"}</TableCell>
                            <TableCell className="max-w-[250px] truncate text-sm">{n.message}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{getNotificationLabel(n.type)}</Badge></TableCell>
                            <TableCell>
                              <Badge variant="outline" className={st.className}>
                                <StIcon className="h-3 w-3 me-1" />{st.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => handleResend(n)} disabled={resend.isPending}>
                                <RotateCcw className="h-3 w-3" /> إعادة إرسال
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>السابق</Button>
                  <span className="text-sm text-muted-foreground flex items-center">صفحة {page + 1}</span>
                  <Button variant="outline" size="sm" disabled={(notifications?.length ?? 0) < 50} onClick={() => setPage(p => p + 1)}>التالي</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
