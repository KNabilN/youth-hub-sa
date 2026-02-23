import { DashboardLayout } from "@/components/DashboardLayout";
import { FinanceSummary } from "@/components/admin/FinanceSummary";
import { useEscrowTransactions, useInvoices } from "@/hooks/useAdminFinance";
import { useAllWithdrawals, useUpdateWithdrawalStatus } from "@/hooks/useWithdrawals";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const escrowStatusLabels: Record<string, string> = { held: "محتجز", released: "محرر", frozen: "مجمد", refunded: "مسترد" };
const escrowStatusColors: Record<string, string> = {
  held: "bg-yellow-500/10 text-yellow-600", released: "bg-emerald-500/10 text-emerald-600",
  frozen: "bg-blue-500/10 text-blue-600", refunded: "bg-muted text-muted-foreground",
};
const wStatusLabels: Record<string, string> = { pending: "قيد المراجعة", approved: "تمت الموافقة", rejected: "مرفوض" };

export default function AdminFinance() {
  const { data: escrows, isLoading: loadingEscrow } = useEscrowTransactions();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: withdrawals, isLoading: loadingW } = useAllWithdrawals();
  const updateW = useUpdateWithdrawalStatus();

  const handleWithdrawal = (id: string, status: string) => {
    updateW.mutate({ id, status }, {
      onSuccess: () => toast.success(status === "approved" ? "تمت الموافقة" : "تم الرفض"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">النظرة المالية</h1>
        <FinanceSummary />
        <Tabs defaultValue="escrow">
          <TabsList>
            <TabsTrigger value="escrow">الضمان</TabsTrigger>
            <TabsTrigger value="invoices">الفواتير</TabsTrigger>
            <TabsTrigger value="withdrawals">طلبات السحب</TabsTrigger>
          </TabsList>
          <TabsContent value="escrow">
            {loadingEscrow ? <p className="text-center py-8 text-muted-foreground">جارٍ التحميل...</p> : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المشروع</TableHead>
                      <TableHead>الدافع</TableHead>
                      <TableHead>المستفيد</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(escrows ?? []).map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.projects?.title ?? "—"}</TableCell>
                        <TableCell>{e.profiles?.full_name ?? "—"}</TableCell>
                        <TableCell>{(e as any)["profiles"]?.full_name ?? "—"}</TableCell>
                        <TableCell>{Number(e.amount).toLocaleString()} ر.س</TableCell>
                        <TableCell><Badge className={escrowStatusColors[e.status]}>{escrowStatusLabels[e.status]}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(e.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                      </TableRow>
                    ))}
                    {(escrows ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد معاملات</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="invoices">
            {loadingInvoices ? <p className="text-center py-8 text-muted-foreground">جارٍ التحميل...</p> : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>المستلم</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>العمولة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoices ?? []).map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                        <TableCell>{inv.profiles?.full_name ?? "—"}</TableCell>
                        <TableCell>{Number(inv.amount).toLocaleString()} ر.س</TableCell>
                        <TableCell>{Number(inv.commission_amount).toLocaleString()} ر.س</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                      </TableRow>
                    ))}
                    {(invoices ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد فواتير</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="withdrawals">
            {loadingW ? <p className="text-center py-8 text-muted-foreground">جارٍ التحميل...</p> : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(withdrawals ?? []).map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{Number(w.amount).toLocaleString()} ر.س</TableCell>
                        <TableCell><Badge variant="outline">{wStatusLabels[w.status] ?? w.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(w.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                        <TableCell>
                          {w.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleWithdrawal(w.id, "approved")}>موافقة</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleWithdrawal(w.id, "rejected")}>رفض</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(withdrawals ?? []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد طلبات سحب</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
