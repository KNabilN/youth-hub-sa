import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyInvoices } from "@/hooks/useMyInvoices";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt } from "lucide-react";

export default function Invoices() {
  const { data: invoices, isLoading } = useMyInvoices();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Styled Page Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Receipt className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الفواتير</h1>
            <p className="text-sm text-muted-foreground">سجل الفواتير والعمولات الخاصة بمشاريعك</p>
          </div>
        </div>

        {/* Gradient Divider */}
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !invoices?.length ? (
          <EmptyState icon={Receipt} title="لا توجد فواتير" description="ستظهر الفواتير هنا بعد إتمام المشاريع" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>المشروع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>العمولة</TableHead>
                    <TableHead>الصافي</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any) => (
                    <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.escrow_transactions?.projects?.title ?? "—"}</TableCell>
                      <TableCell>{Number(inv.amount).toLocaleString()} ر.س</TableCell>
                      <TableCell className="text-destructive">{Number(inv.commission_amount).toLocaleString()} ر.س</TableCell>
                      <TableCell className="font-semibold text-success">
                        {(Number(inv.amount) - Number(inv.commission_amount)).toLocaleString()} ر.س
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(inv.created_at).toLocaleDateString("ar-SA")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
