import { DashboardLayout } from "@/components/DashboardLayout";
import { FinanceSummary } from "@/components/admin/FinanceSummary";
import { useEscrowTransactions, useInvoices, useUpdateEscrowStatus } from "@/hooks/useAdminFinance";
import { useAllWithdrawals, useUpdateWithdrawalStatus } from "@/hooks/useWithdrawals";
import { useAdminBankTransfers, useApproveBankTransfer, useRejectBankTransfer } from "@/hooks/useBankTransfer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Lock, Unlock, Snowflake, RotateCcw, AlertTriangle, Eye, Download, FileText, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";
import { generateInvoicePDF, type InvoiceData, type InvoiceTemplateConfig } from "@/lib/zatca-invoice";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const { data: bankTransfers, isLoading: loadingBT } = useAdminBankTransfers();
  const updateW = useUpdateWithdrawalStatus();
  const updateEscrow = useUpdateEscrowStatus();
  const approveBT = useApproveBankTransfer();
  const rejectBT = useRejectBankTransfer();
  const { data: templateContent } = useSiteContent("invoice_template");
  const queryClient = useQueryClient();
  const [escrowFilter, setEscrowFilter] = useState("all");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ transferId: string; escrowId: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">النظرة المالية</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة الضمان المالي والفواتير وطلبات السحب</p>
        </div>
        <FinanceSummary />
        <Tabs defaultValue="escrow">
          <div className="flex justify-end">
            <TabsList>
              <TabsTrigger value="escrow">الضمان</TabsTrigger>
              <TabsTrigger value="invoices">الفواتير</TabsTrigger>
              <TabsTrigger value="withdrawals">طلبات السحب</TabsTrigger>
              <TabsTrigger value="bank-transfers">التحويلات البنكية</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="escrow">
            <div className="flex flex-wrap gap-2 items-center mb-5 justify-end bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                onClick={() => {
                  toast.info("جارٍ تصدير الضمان...");
                  downloadCSV("escrow.csv",
                    ["الطلب", "الدافع", "المستفيد", "المبلغ", "الحالة", "التاريخ"],
                    (escrows ?? []).map((e: any) => [
                      e.projects?.title || "", e.profiles?.full_name || "", "",
                      String(e.amount), escrowStatusLabels[e.status] || e.status, e.created_at?.slice(0, 10) || "",
                    ])
                  );
                }}
              >
                <Download className="h-4 w-4" />تصدير CSV
              </Button>
              <span className="text-xs text-muted-foreground bg-background rounded-full px-3 py-1 border">{filteredEscrows.length} معاملة</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground hover:text-foreground"
                onClick={() => setEscrowFilter("all")}
              >
                <RotateCcw className="h-3.5 w-3.5 me-1" />إعادة تعيين
              </Button>
              <Select value={escrowFilter} onValueChange={setEscrowFilter}>
                <SelectTrigger className="w-44 h-9 bg-background"><SelectValue placeholder="تصفية الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(escrowStatusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-xs font-medium text-muted-foreground">الحالة</Label>
            </div>
            {loadingEscrow ? (
              <div className="border rounded-lg p-4 space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>إجراءات</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>المستفيد</TableHead>
                      <TableHead>الدافع</TableHead>
                      <TableHead>الطلب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEscrows.map((e: any) => (
                      <TableRow key={e.id}>
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
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(e.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                        <TableCell><Badge className={escrowStatusColors[e.status]}>{escrowStatusLabels[e.status] ?? e.status}</Badge></TableCell>
                        <TableCell className="font-medium">{Number(e.amount).toLocaleString()} ر.س</TableCell>
                        <TableCell>{(e as any)["profiles"]?.full_name ?? "—"}</TableCell>
                        <TableCell>{e.profiles?.full_name ?? "—"}</TableCell>
                        <TableCell>{e.projects?.title ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredEscrows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد معاملات</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="invoices">
            <div className="flex flex-wrap gap-2 items-center mb-5 justify-end bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                onClick={() => {
                  toast.info("جارٍ تصدير الفواتير...");
                  downloadCSV("invoices.csv",
                    ["رقم الفاتورة", "المستلم", "المبلغ", "العمولة", "الصافي", "الحالة", "التاريخ"],
                    (invoices ?? []).map((inv: any) => [
                      inv.invoice_number, inv.profiles?.full_name || "", String(inv.amount),
                      String(inv.commission_amount), String(Number(inv.amount) - Number(inv.commission_amount)),
                      inv.status, inv.created_at?.slice(0, 10) || "",
                    ])
                  );
                }}
              >
                <Download className="h-4 w-4" />تصدير CSV
              </Button>
              <span className="text-xs text-muted-foreground bg-background rounded-full px-3 py-1 border">{filteredInvoices.length} فاتورة</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground hover:text-foreground"
                onClick={() => setInvoiceFilter("all")}
              >
                <RotateCcw className="h-3.5 w-3.5 me-1" />إعادة تعيين
              </Button>
              <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                <SelectTrigger className="w-44 h-9 bg-background"><SelectValue placeholder="تصفية الحالة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="issued">صادرة</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="viewed">تم الاطلاع</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                  <SelectItem value="archived">مؤرشفة</SelectItem>
                </SelectContent>
              </Select>
              <Label className="text-xs font-medium text-muted-foreground">الحالة</Label>
            </div>
            {loadingInvoices ? (
              <div className="border rounded-lg p-4 space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>إجراءات</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الصافي</TableHead>
                      <TableHead>العمولة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>المستلم</TableHead>
                      <TableHead>رقم الفاتورة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((inv: any) => {
                      const statusLabel = inv.status === "issued" ? "صادرة" : inv.status === "paid" ? "مدفوعة" : inv.status === "viewed" ? "تم الاطلاع" : inv.status === "cancelled" ? "ملغاة" : inv.status === "archived" ? "مؤرشفة" : inv.status;
                      const statusVariant = inv.status === "issued" ? "default" : inv.status === "paid" ? "default" : inv.status === "viewed" ? "secondary" : inv.status === "cancelled" ? "destructive" : "outline";
                      return (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleDownloadInvoice(inv)} title="تحميل PDF">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{inv.notes || "—"}</TableCell>
                          <TableCell><Badge variant={statusVariant}>{statusLabel}</Badge></TableCell>
                          <TableCell className="font-semibold">{(Number(inv.amount) - Number(inv.commission_amount)).toLocaleString()} ر.س</TableCell>
                          <TableCell className="text-destructive">{Number(inv.commission_amount).toLocaleString()} ر.س</TableCell>
                          <TableCell>{Number(inv.amount).toLocaleString()} ر.س</TableCell>
                          <TableCell>{inv.profiles?.full_name ?? "—"}</TableCell>
                          <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
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
            <div className="flex gap-2 items-center mb-5 justify-end bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                onClick={() => {
                  toast.info("جارٍ تصدير طلبات السحب...");
                  downloadCSV("withdrawals.csv",
                    ["المبلغ", "الحالة", "التاريخ"],
                    (withdrawals ?? []).map((w: any) => [
                      String(w.amount), wStatusLabels[w.status] || w.status, w.created_at?.slice(0, 10) || "",
                    ])
                  );
                }}
              >
                <Download className="h-4 w-4" />تصدير CSV
              </Button>
            </div>
            {loadingW ? (
              <div className="border rounded-lg p-4 space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>إجراءات</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(withdrawals ?? []).map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell>
                          {w.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleWithdrawal(w.id, "approved")}>موافقة</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleWithdrawal(w.id, "rejected")}>رفض</Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(w.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                        <TableCell><Badge variant="outline">{wStatusLabels[w.status] ?? w.status}</Badge></TableCell>
                        <TableCell className="font-medium">{Number(w.amount).toLocaleString()} ر.س</TableCell>
                      </TableRow>
                    ))}
                    {(withdrawals ?? []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد طلبات سحب</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="bank-transfers">
            <div className="flex gap-2 items-center mb-5 justify-end bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                onClick={() => {
                  toast.info("جارٍ تصدير التحويلات البنكية...");
                  downloadCSV("bank-transfers.csv",
                    ["المستخدم", "المبلغ", "الحالة", "التاريخ"],
                    (bankTransfers ?? []).map((bt: any) => [
                      bt.profiles?.full_name || "", String(bt.amount),
                      bt.status === "pending" ? "قيد المراجعة" : bt.status === "approved" ? "تمت الموافقة" : "مرفوض",
                      bt.created_at?.slice(0, 10) || "",
                    ])
                  );
                }}
              >
                <Download className="h-4 w-4" />تصدير CSV
              </Button>
            </div>
            {loadingBT ? (
              <div className="border rounded-lg p-4 space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>إجراءات</TableHead>
                      <TableHead>الإيصال</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>المستخدم</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(bankTransfers ?? []).map((bt: any) => {
                      const statusLabel = bt.status === "pending" ? "قيد المراجعة" : bt.status === "approved" ? "تمت الموافقة" : "مرفوض";
                      const statusColor = bt.status === "pending" ? "bg-orange-500/10 text-orange-600" : bt.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive";
                      return (
                        <TableRow key={bt.id}>
                          <TableCell>
                            {bt.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    approveBT.mutate({ transferId: bt.id, escrowId: bt.escrow_id }, {
                                      onSuccess: () => toast.success("تمت الموافقة على التحويل"),
                                      onError: () => toast.error("حدث خطأ"),
                                    });
                                  }}
                                  disabled={approveBT.isPending}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 me-1" />موافقة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setRejectTarget({ transferId: bt.id, escrowId: bt.escrow_id });
                                    setRejectNote("");
                                    setRejectDialogOpen(true);
                                  }}
                                  disabled={rejectBT.isPending}
                                >
                                  <XCircle className="h-3.5 w-3.5 me-1" />رفض
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">{bt.admin_note || "—"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                const { data } = await supabase.storage.from("transfer-receipts").createSignedUrl(bt.receipt_url, 300);
                                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                else toast.error("تعذر فتح الإيصال");
                              }}
                            >
                              <ExternalLink className="h-3.5 w-3.5 me-1" />عرض
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(bt.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                          <TableCell><Badge className={statusColor}>{statusLabel}</Badge></TableCell>
                          <TableCell className="font-medium">{Number(bt.amount).toLocaleString()} ر.س</TableCell>
                          <TableCell>{bt.profiles?.full_name ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {(bankTransfers ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد تحويلات بنكية</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رفض التحويل البنكي</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>سبب الرفض (اختياري)</Label>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="اكتب سبب الرفض..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>إلغاء</Button>
              <Button
                variant="destructive"
                disabled={rejectBT.isPending}
                onClick={() => {
                  if (!rejectTarget) return;
                  rejectBT.mutate({ ...rejectTarget, adminNote: rejectNote }, {
                    onSuccess: () => {
                      toast.success("تم رفض التحويل");
                      setRejectDialogOpen(false);
                    },
                    onError: () => toast.error("حدث خطأ"),
                  });
                }}
              >
                تأكيد الرفض
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
