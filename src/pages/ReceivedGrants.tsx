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
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المانح</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grants.map((g: any) => {
                    const s = statusLabels[g.donation_status] || statusLabels.available;
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">
                          {g.profiles?.organization_name || g.profiles?.full_name || "مانح"}
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
