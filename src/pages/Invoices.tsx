import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyInvoices } from "@/hooks/useMyInvoices";
import { useProfile } from "@/hooks/useProfile";
import { useSiteContent } from "@/hooks/useSiteContent";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Download, Archive, RotateCcw } from "lucide-react";
import { generateInvoicePDF, type InvoiceData, type InvoiceTemplateConfig } from "@/lib/zatca-invoice";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  issued: { label: "صادرة", variant: "default" },
  viewed: { label: "تم الاطلاع", variant: "secondary" },
  archived: { label: "مؤرشفة", variant: "outline" },
};

export default function Invoices() {
  const { data: invoices, isLoading } = useMyInvoices();
  const { data: profile } = useProfile();
  const { data: templateContent } = useSiteContent("invoice_template");
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const template = (templateContent?.content as unknown as InvoiceTemplateConfig) ?? undefined;

  const filtered = (invoices ?? []).filter((inv: any) => {
    if (statusFilter === "all") return true;
    const invStatus = (inv as any).status ?? "issued";
    return invStatus === statusFilter;
  });

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
      await generateInvoicePDF(invoiceData, template);

      // Mark as viewed
      if ((inv as any).status === "issued") {
        await supabase.from("invoices").update({ status: "viewed" } as any).eq("id", inv.id);
        queryClient.invalidateQueries({ queryKey: ["my-invoices"] });
      }

      toast.success("تم تحميل الفاتورة بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء توليد الفاتورة");
    }
  };

  const handleArchive = async (inv: any) => {
    await supabase.from("invoices").update({ status: "archived", archived_at: new Date().toISOString() } as any).eq("id", inv.id);
    queryClient.invalidateQueries({ queryKey: ["my-invoices"] });
    toast.success("تم أرشفة الفاتورة");
  };

  const handleUnarchive = async (inv: any) => {
    await supabase.from("invoices").update({ status: "issued", archived_at: null } as any).eq("id", inv.id);
    queryClient.invalidateQueries({ queryKey: ["my-invoices"] });
    toast.success("تم إلغاء الأرشفة");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <Receipt className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الفواتير</h1>
              <p className="text-sm text-muted-foreground">سجل الفواتير والعمولات الخاصة بمشاريعك</p>
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="issued">صادرة</SelectItem>
              <SelectItem value="viewed">تم الاطلاع</SelectItem>
              <SelectItem value="archived">مؤرشفة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !filtered?.length ? (
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
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv: any) => {
                    const invStatus = (inv as any).status ?? "issued";
                    const st = statusLabels[invStatus] ?? statusLabels.issued;
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                        <TableCell>{inv.escrow_transactions?.projects?.title ?? "—"}</TableCell>
                        <TableCell>{Number(inv.amount).toLocaleString()} ر.س</TableCell>
                        <TableCell className="text-destructive">{Number(inv.commission_amount).toLocaleString()} ر.س</TableCell>
                        <TableCell className="font-semibold text-success">
                          {(Number(inv.amount) - Number(inv.commission_amount)).toLocaleString()} ر.س
                        </TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(inv.created_at).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleDownloadPDF(inv)} title="تحميل PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                            {invStatus !== "archived" ? (
                              <Button size="icon" variant="ghost" onClick={() => handleArchive(inv)} title="أرشفة">
                                <Archive className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button size="icon" variant="ghost" onClick={() => handleUnarchive(inv)} title="إلغاء الأرشفة">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
