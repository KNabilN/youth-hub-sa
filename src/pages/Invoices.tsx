import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyInvoices } from "@/hooks/useMyInvoices";
import { useProfile } from "@/hooks/useProfile";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Receipt, Download } from "lucide-react";
import { generateInvoicePDF, type InvoiceData } from "@/lib/zatca-invoice";
import { toast } from "sonner";

export default function Invoices() {
  const { data: invoices, isLoading } = useMyInvoices();
  const { data: profile } = useProfile();

  const handleDownloadPDF = async (inv: any) => {
    try {
      const invoiceData: InvoiceData = {
        invoiceNumber: inv.invoice_number,
        amount: Number(inv.amount),
        commissionAmount: Number(inv.commission_amount),
        createdAt: inv.created_at,
        projectTitle: inv.escrow_transactions?.projects?.title ?? "خدمة",
        recipientName: profile?.full_name ?? "—",
      };
      await generateInvoicePDF(invoiceData);
      toast.success("تم تحميل الفاتورة بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء توليد الفاتورة");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Receipt className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الفواتير</h1>
            <p className="text-sm text-muted-foreground">سجل الفواتير والعمولات الخاصة بمشاريعك</p>
          </div>
        </div>

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
                    <TableHead>PDF</TableHead>
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
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => handleDownloadPDF(inv)} title="تحميل PDF">
                          <Download className="h-4 w-4" />
                        </Button>
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
