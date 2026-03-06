import { DashboardLayout } from "@/components/DashboardLayout";
import { useReceivedGrants, useAssociationGrantBalance } from "@/hooks/useAssociationGrants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HandCoins, Wallet, Lock, CheckCircle2 } from "lucide-react";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: "متاح", variant: "default" },
  consumed: { label: "مستهلك", variant: "secondary" },
  reserved: { label: "محجوز", variant: "outline" },
};

function getDonationType(g: any): { label: string; className: string } {
  if (g.project_id && g.projects?.title) {
    return { label: `مخصص لطلب`, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
  }
  if (g.service_id && g.micro_services?.title) {
    return { label: `مخصص لخدمة`, className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" };
  }
  return { label: "دعم عام", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" };
}

function getLinkedEntityName(g: any): string | null {
  if (g.project_id && g.projects?.title) return g.projects.title;
  if (g.service_id && g.micro_services?.title) return g.micro_services.title;
  return null;
}

export default function ReceivedGrants() {
  const { data: grants, isLoading } = useReceivedGrants();
  const { data: balance } = useAssociationGrantBalance();

  if (isLoading) return <DashboardLayout><ContentSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">المنح المستلمة</h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-s-4 border-s-success">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">الرصيد المتاح</p>
                  <p className="text-2xl font-bold">{(balance?.available ?? 0).toLocaleString()} ر.س</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10"><Wallet className="h-5 w-5 text-success" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-s-4 border-s-warning">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">محجوز</p>
                  <p className="text-2xl font-bold">{(balance?.reserved ?? 0).toLocaleString()} ر.س</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10"><Lock className="h-5 w-5 text-warning" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-s-4 border-s-muted-foreground">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">مستهلك</p>
                  <p className="text-2xl font-bold">{(balance?.consumed ?? 0).toLocaleString()} ر.س</p>
                </div>
                <div className="p-3 rounded-xl bg-muted"><CheckCircle2 className="h-5 w-5 text-muted-foreground" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grants Table */}
        {!grants?.length ? (
          <EmptyState icon={HandCoins} title="لا توجد منح مستلمة" description="لم تتلقَ أي منح حتى الآن" />
        ) : (
          <Card>
            <CardHeader><CardTitle>سجل المنح الواردة</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المانح</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المرتبط بـ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grants.map((g: any) => {
                    const s = statusLabels[g.donation_status] || statusLabels.available;
                    const dtype = getDonationType(g);
                    const linkedName = getLinkedEntityName(g);
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">
                          {g.profiles?.organization_name || g.profiles?.full_name || "مانح"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${dtype.className}`}>
                            {dtype.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                          {linkedName || "—"}
                        </TableCell>
                        <TableCell>{Number(g.amount).toLocaleString()} ر.س</TableCell>
                        <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(g.created_at), "d MMM yyyy", { locale: ar })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
