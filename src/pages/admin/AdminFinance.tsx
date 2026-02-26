import { DashboardLayout } from "@/components/DashboardLayout";
import { FinanceSummary } from "@/components/admin/FinanceSummary";
import { useEscrowTransactions, useInvoices, useUpdateEscrowStatus } from "@/hooks/useAdminFinance";
import { useAllWithdrawals, useUpdateWithdrawalStatus } from "@/hooks/useWithdrawals";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { Lock, Unlock, Snowflake, RotateCcw, AlertTriangle, Eye, Download, Archive, FileText } from "lucide-react";
import { generateInvoicePDF, type InvoiceData, type InvoiceTemplateConfig } from "@/lib/zatca-invoice";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const escrowStatusLabels: Record<string, string> = {
  held: "محتجز",
  released: "محرر",
  frozen: "مجمد",
  refunded: "مسترد",
  pending_payment: "قيد الدفع",
  failed: "فشل",
  under_review: "قيد المراجعة",
};
const escrowStatusColors: Record<string, string> = {
  held: "bg-yellow-500/10 text-yellow-600",
  released: "bg-emerald-500/10 text-emerald-600",
  frozen: "bg-blue-500/10 text-blue-600",
  refunded: "bg-muted text-muted-foreground",
  pending_payment: "bg-orange-500/10 text-orange-600",
  failed: "bg-destructive/10 text-destructive",
  under_review: "bg-purple-500/10 text-purple-600",
};
const wStatusLabels: Record<string, string> = { pending: "قيد المراجعة", approved: "تمت الموافقة", rejected: "مرفوض" };

export default function AdminFinance() {
  const { data: escrows, isLoading: loadingEscrow } = useEscrowTransactions();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: withdrawals, isLoading: loadingW } = useAllWithdrawals();
  const updateW = useUpdateWithdrawalStatus();
  const updateEscrow = useUpdateEscrowStatus();
  const { data: templateContent } = useSiteContent("invoice_template");
  const queryClient = useQueryClient();
  const [escrowFilter, setEscrowFilter] = useState("all");
  const [invoiceFilter, setInvoiceFilter] = useState("all");

  const template = (templateContent?.content as unknown as InvoiceTemplateConfig) ?? undefined;

  const handleWithdrawal = (id: string, status: string) => {
    updateW.mutate({ id, status }, {
      onSuccess: () => toast.success(status === "approved" ? "تمت الموافقة" : "تم الرفض"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const handleEscrowStatus = (id: string, status: string) => {
    const labels: Record<string, string> = {
      frozen: "تم تجميد الضمان",
      held: "تم إعادة الضمان للاحتجاز",
      released: "تم تحرير الضمان",
      refunded: "تم استرداد الضمان",
      under_review: "تم وضع الضمان قيد المراجعة",
    };
    updateEscrow.mutate({ id, status: status as any }, {
      onSuccess: () => toast.success(labels[status] || "تم تحديث الحالة"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const filteredEscrows = (escrows ?? []).filter((e: any) =>
    escrowFilter === "all" ? true : e.status === escrowFilter
  );

  const filteredInvoices = (invoices ?? []).filter((inv: any) =>
    invoiceFilter === "all" ? true : inv.status === invoiceFilter
  );

  const handleDownloadInvoice = async (inv: any) => {
    try {
      const invoiceData: InvoiceData = {
        invoiceNumber: inv.invoice_number,
        amount: Number(inv.amount),
        commissionAmount: Number(inv.commission_amount),
        createdAt: inv.created_at,
        projectTitle: "خدمة",
        recipientName: inv.profiles?.full_name ?? "—",
      };
      await generateInvoicePDF(invoiceData, template);
      toast.success("تم تحميل الفاتورة");
    } catch {
      toast.error("حدث خطأ أثناء التحميل");
    }
  };

  const handleArchiveInvoice = async (inv: any) => {
    const newStatus = inv.status === "archived" ? "issued" : "archived";
    await supabase.from("invoices").update({
      status: newStatus,
      archived_at: newStatus === "archived" ? new Date().toISOString() : null,
    }).eq("id", inv.id);
    queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
    toast.success(newStatus === "archived" ? "تم أرشفة الفاتورة" : "تم إلغاء الأرشفة");
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
            <div className="flex items-center gap-3 mb-4">
              <Select value={escrowFilter} onValueChange={setEscrowFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="تصفية الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(escrowStatusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filteredEscrows.length} معاملة</span>
            </div>
            {loadingEscrow ? <p className="text-center py-8 text-muted-foreground">جارٍ التحميل...</p> : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطلب</TableHead>
                      <TableHead>الدافع</TableHead>
                      <TableHead>المستفيد</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEscrows.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.projects?.title ?? "—"}</TableCell>
                        <TableCell>{e.profiles?.full_name ?? "—"}</TableCell>
                        <TableCell>{(e as any)["profiles"]?.full_name ?? "—"}</TableCell>
                        <TableCell className="font-medium">{Number(e.amount).toLocaleString()} ر.س</TableCell>
                        <TableCell><Badge className={escrowStatusColors[e.status]}>{escrowStatusLabels[e.status] ?? e.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(e.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {e.status === "held" && (
                              <>
                                <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleEscrowStatus(e.id, "released")} disabled={updateEscrow.isPending}>
                                  <Unlock className="h-3.5 w-3.5 me-1" />تحرير
                                </Button>
                                <Button size="sm" variant="outline" className="text-blue-600 hover:bg-blue-500/10" onClick={() => handleEscrowStatus(e.id, "frozen")} disabled={updateEscrow.isPending}>
                                  <Snowflake className="h-3.5 w-3.5 me-1" />تجميد
                                </Button>
                                <Button size="sm" variant="outline" className="text-muted-foreground" onClick={() => handleEscrowStatus(e.id, "refunded")} disabled={updateEscrow.isPending}>
                                  <RotateCcw className="h-3.5 w-3.5 me-1" />استرداد
                                </Button>
                              </>
                            )}
                            {e.status === "frozen" && (
                              <>
                                <Button size="sm" variant="outline" className="text-yellow-600 hover:bg-yellow-500/10" onClick={() => handleEscrowStatus(e.id, "held")} disabled={updateEscrow.isPending}>
                                  <Lock className="h-3.5 w-3.5 me-1" />إعادة احتجاز
                                </Button>
                                <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleEscrowStatus(e.id, "released")} disabled={updateEscrow.isPending}>
                                  <Unlock className="h-3.5 w-3.5 me-1" />تحرير
                                </Button>
                                <Button size="sm" variant="outline" className="text-muted-foreground" onClick={() => handleEscrowStatus(e.id, "refunded")} disabled={updateEscrow.isPending}>
                                  <RotateCcw className="h-3.5 w-3.5 me-1" />استرداد
                                </Button>
                              </>
                            )}
                            {e.status === "under_review" && (
                              <>
                                <Button size="sm" variant="outline" className="text-yellow-600" onClick={() => handleEscrowStatus(e.id, "held")} disabled={updateEscrow.isPending}>
                                  <Lock className="h-3.5 w-3.5 me-1" />احتجاز
                                </Button>
                                <Button size="sm" variant="outline" className="text-blue-600" onClick={() => handleEscrowStatus(e.id, "frozen")} disabled={updateEscrow.isPending}>
                                  <Snowflake className="h-3.5 w-3.5 me-1" />تجميد
                                </Button>
                              </>
                            )}
                            {e.status === "pending_payment" && (
                              <Button size="sm" variant="outline" className="text-purple-600" onClick={() => handleEscrowStatus(e.id, "under_review")} disabled={updateEscrow.isPending}>
                                <Eye className="h-3.5 w-3.5 me-1" />مراجعة
                              </Button>
                            )}
                            {e.status === "failed" && (
                              <Button size="sm" variant="outline" className="text-orange-600" onClick={() => handleEscrowStatus(e.id, "pending_payment")} disabled={updateEscrow.isPending}>
                                <AlertTriangle className="h-3.5 w-3.5 me-1" />إعادة المحاولة
                              </Button>
                            )}
                            {(e.status === "released" || e.status === "refunded") && (
                              <span className="text-xs text-muted-foreground py-1">مكتمل</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEscrows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد معاملات</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="invoices">
            <div className="flex items-center gap-3 mb-4">
              <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="تصفية الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="issued">صادرة</SelectItem>
                  <SelectItem value="viewed">تم الاطلاع</SelectItem>
                  <SelectItem value="archived">مؤرشفة</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filteredInvoices.length} فاتورة</span>
            </div>
            {loadingInvoices ? <p className="text-center py-8 text-muted-foreground">جارٍ التحميل...</p> : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>المستلم</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>العمولة</TableHead>
                      <TableHead>الصافي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((inv: any) => {
                      const statusLabel = inv.status === "issued" ? "صادرة" : inv.status === "viewed" ? "تم الاطلاع" : inv.status === "archived" ? "مؤرشفة" : inv.status;
                      const statusVariant = inv.status === "issued" ? "default" : inv.status === "viewed" ? "secondary" : "outline";
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                          <TableCell>{inv.profiles?.full_name ?? "—"}</TableCell>
                          <TableCell>{Number(inv.amount).toLocaleString()} ر.س</TableCell>
                          <TableCell className="text-destructive">{Number(inv.commission_amount).toLocaleString()} ر.س</TableCell>
                          <TableCell className="font-semibold">{(Number(inv.amount) - Number(inv.commission_amount)).toLocaleString()} ر.س</TableCell>
                          <TableCell><Badge variant={statusVariant}>{statusLabel}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{inv.notes || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleDownloadInvoice(inv)} title="تحميل PDF">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleArchiveInvoice(inv)} title={inv.status === "archived" ? "إلغاء الأرشفة" : "أرشفة"}>
                                {inv.status === "archived" ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredInvoices.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد فواتير</TableCell></TableRow>}
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
