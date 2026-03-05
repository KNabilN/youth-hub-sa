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
import { ExportDialog, type ExportColumnDef } from "@/components/admin/ExportDialog";
import { downloadCSV } from "@/lib/csv-export";

const escrowExportCols: ExportColumnDef[] = [
  { key: "project", label: "الطلب" }, { key: "payer", label: "الدافع" }, { key: "payee", label: "المستفيد" },
  { key: "amount", label: "المبلغ" }, { key: "status", label: "الحالة" }, { key: "created_at", label: "التاريخ" },
];
const invoiceExportCols: ExportColumnDef[] = [
  { key: "invoice_number", label: "رقم الفاتورة" }, { key: "recipient", label: "المستلم" }, { key: "amount", label: "المبلغ" },
  { key: "commission", label: "العمولة" }, { key: "net", label: "الصافي" }, { key: "status", label: "الحالة" }, { key: "created_at", label: "التاريخ" },
];
const withdrawalExportCols: ExportColumnDef[] = [
  { key: "provider", label: "مقدم الخدمة" }, { key: "amount", label: "المبلغ" }, { key: "bank", label: "البنك" },
  { key: "iban", label: "IBAN" }, { key: "status", label: "الحالة" }, { key: "created_at", label: "التاريخ" },
];
const bankTransferExportCols: ExportColumnDef[] = [
  { key: "user", label: "المستخدم" }, { key: "amount", label: "المبلغ" }, { key: "status", label: "الحالة" }, { key: "created_at", label: "التاريخ" },
];
import { generateInvoicePDF, type InvoiceData, type InvoiceTemplateConfig } from "@/lib/zatca-invoice";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAdminFinancePending } from "@/hooks/useAdminFinancePending";

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
  const { data: pendingCounts } = useAdminFinancePending();
  const [escrowFilter, setEscrowFilter] = useState("all");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ transferId: string; escrowId: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Withdrawal approval/rejection dialogs
  const [wApproveDialogOpen, setWApproveDialogOpen] = useState(false);
  const [wRejectDialogOpen, setWRejectDialogOpen] = useState(false);
  const [wTargetId, setWTargetId] = useState("");
  const [wTargetProviderId, setWTargetProviderId] = useState("");
  const [wReceiptFile, setWReceiptFile] = useState<File | null>(null);
  const [wRejectReason, setWRejectReason] = useState("");
  const [wUploading, setWUploading] = useState(false);
  const [exportEscrow, setExportEscrow] = useState(false);
  const [exportInvoice, setExportInvoice] = useState(false);
  const [exportWithdrawal, setExportWithdrawal] = useState(false);
  const [exportBankTransfer, setExportBankTransfer] = useState(false);

  const template = (templateContent?.content as unknown as InvoiceTemplateConfig) ?? undefined;

  const handleApproveWithdrawal = async () => {
    if (!wReceiptFile || !wTargetId) { toast.error("يرجى إرفاق ملف الإيصال"); return; }
    setWUploading(true);
    try {
      const filePath = `${wTargetId}/${Date.now()}_${wReceiptFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("withdrawal-receipts").upload(filePath, wReceiptFile);
      if (uploadErr) throw uploadErr;
      updateW.mutate({ id: wTargetId, status: "approved", receipt_url: filePath }, {
        onSuccess: () => { toast.success("تمت الموافقة وإرفاق الإيصال"); setWApproveDialogOpen(false); setWReceiptFile(null); },
        onError: () => toast.error("حدث خطأ"),
      });
    } catch { toast.error("فشل رفع الملف"); }
    finally { setWUploading(false); }
  };

  const handleRejectWithdrawal = () => {
    if (!wRejectReason.trim()) { toast.error("يرجى كتابة سبب الرفض"); return; }
    updateW.mutate({ id: wTargetId, status: "rejected", rejection_reason: wRejectReason }, {
      onSuccess: () => { toast.success("تم الرفض وإرسال السبب"); setWRejectDialogOpen(false); setWRejectReason(""); },
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
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">النظرة المالية</h1>
            <p className="text-sm text-muted-foreground">إدارة الضمان المالي والفواتير وطلبات السحب</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />
        <FinanceSummary />
        <Tabs defaultValue="escrow">
          <div className="flex justify-end overflow-x-auto">
            <TabsList className="flex-nowrap scrollbar-hide">
              <TabsTrigger value="escrow" className="gap-1.5">
                الضمان
                {(pendingCounts?.escrow ?? 0) > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full">{pendingCounts!.escrow}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="invoices">الفواتير</TabsTrigger>
              <TabsTrigger value="withdrawals" className="gap-1.5">
                طلبات السحب
                {(pendingCounts?.withdrawals ?? 0) > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full">{pendingCounts!.withdrawals}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="bank-transfers" className="gap-1.5">
                التحويلات البنكية
                {(pendingCounts?.bankTransfers ?? 0) > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full">{pendingCounts!.bankTransfers}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="escrow">
            <div className="flex flex-wrap gap-2 items-center mb-5 justify-end bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                onClick={() => setExportEscrow(true)}
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
                      <TableHead className="min-w-[140px]">#</TableHead>
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
                        <TableCell>{(e as any).payee?.full_name ?? "—"}</TableCell>
                        <TableCell>{(e as any).payer?.full_name ?? "—"}</TableCell>
                        <TableCell>{e.projects?.title ?? "—"}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground whitespace-nowrap">{e.escrow_number || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredEscrows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد معاملات</TableCell></TableRow>}
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
                onClick={() => setExportInvoice(true)}
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
                onClick={() => setExportWithdrawal(true)}
              >
                <Download className="h-4 w-4" />تصدير CSV
              </Button>
              <span className="text-xs text-muted-foreground bg-background rounded-full px-3 py-1 border">{(withdrawals ?? []).length} طلب</span>
            </div>
            {loadingW ? (
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
                      <TableHead>البيانات البنكية</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>مقدم الخدمة</TableHead>
                       <TableHead className="min-w-[140px]">#</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(withdrawals ?? []).map((w: any, idx: number) => {
                      const profile = (w as any).profiles;
                      const providerName = profile?.full_name || profile?.organization_name || "—";
                      const statusColor = w.status === "pending" ? "bg-orange-500/10 text-orange-600" : w.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive";
                      return (
                        <TableRow key={w.id}>
                          <TableCell>
                            {w.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => {
                                  setWTargetId(w.id);
                                  setWTargetProviderId(w.provider_id);
                                  setWReceiptFile(null);
                                  setWApproveDialogOpen(true);
                                }} disabled={updateW.isPending}>
                                  <CheckCircle className="h-3.5 w-3.5 me-1" />موافقة
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => {
                                  setWTargetId(w.id);
                                  setWTargetProviderId(w.provider_id);
                                  setWRejectReason("");
                                  setWRejectDialogOpen(true);
                                }} disabled={updateW.isPending}>
                                  <XCircle className="h-3.5 w-3.5 me-1" />رفض
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {w.processed_at ? format(new Date(w.processed_at), "yyyy/MM/dd", { locale: ar }) : "—"}
                                </span>
                                {w.status === "approved" && w.receipt_url && (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={async () => {
                                    const { data } = await supabase.storage.from("withdrawal-receipts").createSignedUrl(w.receipt_url, 300);
                                    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                    else toast.error("تعذر فتح الإيصال");
                                  }}>
                                    <ExternalLink className="h-3 w-3 me-1" />الإيصال
                                  </Button>
                                )}
                                {w.status === "rejected" && w.rejection_reason && (
                                  <span className="text-xs text-destructive">السبب: {w.rejection_reason}</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(w.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                          <TableCell><Badge className={statusColor}>{wStatusLabels[w.status] ?? w.status}</Badge></TableCell>
                          <TableCell>
                            {profile?.bank_name ? (
                              <div className="text-xs space-y-0.5">
                                <p className="font-medium">{profile.bank_name}</p>
                                {profile.bank_iban && <p className="text-muted-foreground font-mono text-[11px] truncate max-w-[180px]" title={profile.bank_iban}>{profile.bank_iban}</p>}
                                {profile.bank_account_holder && <p className="text-muted-foreground">{profile.bank_account_holder}</p>}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">لم يُحدد</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold text-base">{Number(w.amount).toLocaleString()} ر.س</TableCell>
                          <TableCell className="font-medium">{providerName}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground whitespace-nowrap">{w.withdrawal_number || idx + 1}</TableCell>
                        </TableRow>
                      );
                    })}
                    {(withdrawals ?? []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد طلبات سحب</TableCell></TableRow>}
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
                onClick={() => setExportBankTransfer(true)}
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
                      <TableHead>الخدمة / المشروع</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead className="min-w-[140px]">#</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(bankTransfers ?? []).map((bt: any) => {
                      const statusLabel = bt.status === "pending" ? "قيد المراجعة" : bt.status === "approved" ? "تمت الموافقة" : "مرفوض";
                      const statusColor = bt.status === "pending" ? "bg-orange-500/10 text-orange-600" : bt.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive";
                      const escrowData = bt.escrow_transactions;
                      const serviceOrProject = escrowData?.micro_services?.title || escrowData?.projects?.title || "—";
                      return (
                        <TableRow key={bt.id}>
                          <TableCell>
                            {bt.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    approveBT.mutate({ transferId: bt.id, escrowId: bt.escrow_id }, {
                                      onSuccess: () => toast.success("تمت الموافقة — تم إصدار الفاتورة وإنشاء العقد تلقائياً"),
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
                          <TableCell className="text-sm">{serviceOrProject}</TableCell>
                          <TableCell>{bt.profiles?.full_name ?? "—"}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground whitespace-nowrap">{bt.transfer_number || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {(bankTransfers ?? []).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد تحويلات بنكية</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Withdrawal Approve Dialog */}
        <Dialog open={wApproveDialogOpen} onOpenChange={setWApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إرفاق إيصال التحويل</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label>ملف الإيصال <span className="text-destructive">*</span></Label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setWReceiptFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:me-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              {wReceiptFile && <p className="text-xs text-muted-foreground">{wReceiptFile.name}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWApproveDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleApproveWithdrawal} disabled={wUploading || updateW.isPending || !wReceiptFile}>
                {wUploading ? "جارٍ الرفع..." : "موافقة وإرفاق"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdrawal Reject Dialog */}
        <Dialog open={wRejectDialogOpen} onOpenChange={setWRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رفض طلب السحب</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label>سبب الرفض <span className="text-destructive">*</span></Label>
              <Textarea
                value={wRejectReason}
                onChange={(e) => setWRejectReason(e.target.value)}
                placeholder="اكتب سبب الرفض الذي سيصل لمزود الخدمة..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWRejectDialogOpen(false)}>إلغاء</Button>
              <Button variant="destructive" onClick={handleRejectWithdrawal} disabled={updateW.isPending || !wRejectReason.trim()}>
                تأكيد الرفض
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* Export Dialogs */}
        <ExportDialog
          open={exportEscrow}
          onOpenChange={setExportEscrow}
          title="تصدير الضمان المالي"
          filename="escrow.csv"
          columns={escrowExportCols}
          defaultColumns={escrowExportCols.map(c => c.key)}
          filters={[{ key: "status", label: "الحالة", options: Object.entries(escrowStatusLabels).map(([k, v]) => ({ value: k, label: v })) }]}
          onExport={async (cols, filters) => {
            let rows = escrows ?? [];
            if (filters.status !== "all") rows = rows.filter((e: any) => e.status === filters.status);
            const colMap: Record<string, (e: any) => string> = {
              project: (e) => e.projects?.title || "",
              payer: (e) => (e as any).payer?.full_name || "",
              payee: (e) => (e as any).payee?.full_name || "",
              amount: (e) => String(e.amount),
              status: (e) => escrowStatusLabels[e.status] || e.status,
              created_at: (e) => e.created_at?.slice(0, 10) || "",
            };
            const active = escrowExportCols.filter(c => cols.includes(c.key));
            return { headers: active.map(c => c.label), rows: rows.map((e: any) => active.map(c => colMap[c.key]?.(e) ?? "")) };
          }}
        />
        <ExportDialog
          open={exportInvoice}
          onOpenChange={setExportInvoice}
          title="تصدير الفواتير"
          filename="invoices.csv"
          columns={invoiceExportCols}
          defaultColumns={invoiceExportCols.map(c => c.key)}
          onExport={async (cols) => {
            const rows = invoices ?? [];
            const colMap: Record<string, (inv: any) => string> = {
              invoice_number: (inv) => inv.invoice_number || "",
              recipient: (inv) => inv.profiles?.full_name || "",
              amount: (inv) => String(inv.amount),
              commission: (inv) => String(inv.commission_amount),
              net: (inv) => String(Number(inv.amount) - Number(inv.commission_amount)),
              status: (inv) => inv.status || "",
              created_at: (inv) => inv.created_at?.slice(0, 10) || "",
            };
            const active = invoiceExportCols.filter(c => cols.includes(c.key));
            return { headers: active.map(c => c.label), rows: rows.map((inv: any) => active.map(c => colMap[c.key]?.(inv) ?? "")) };
          }}
        />
        <ExportDialog
          open={exportWithdrawal}
          onOpenChange={setExportWithdrawal}
          title="تصدير طلبات السحب"
          filename="withdrawals.csv"
          columns={withdrawalExportCols}
          defaultColumns={withdrawalExportCols.map(c => c.key)}
          filters={[{ key: "status", label: "الحالة", options: Object.entries(wStatusLabels).map(([k, v]) => ({ value: k, label: v })) }]}
          onExport={async (cols, filters) => {
            let rows = withdrawals ?? [];
            if (filters.status !== "all") rows = rows.filter((w: any) => w.status === filters.status);
            const colMap: Record<string, (w: any) => string> = {
              provider: (w) => (w as any).profiles?.full_name || (w as any).profiles?.organization_name || "",
              amount: (w) => String(w.amount),
              bank: (w) => (w as any).profiles?.bank_name || "",
              iban: (w) => (w as any).profiles?.bank_iban || "",
              status: (w) => wStatusLabels[w.status] || w.status,
              created_at: (w) => w.created_at?.slice(0, 10) || "",
            };
            const active = withdrawalExportCols.filter(c => cols.includes(c.key));
            return { headers: active.map(c => c.label), rows: rows.map((w: any) => active.map(c => colMap[c.key]?.(w) ?? "")) };
          }}
        />
        <ExportDialog
          open={exportBankTransfer}
          onOpenChange={setExportBankTransfer}
          title="تصدير التحويلات البنكية"
          filename="bank-transfers.csv"
          columns={bankTransferExportCols}
          defaultColumns={bankTransferExportCols.map(c => c.key)}
          onExport={async (cols) => {
            const rows = bankTransfers ?? [];
            const colMap: Record<string, (bt: any) => string> = {
              user: (bt) => bt.profiles?.full_name || "",
              amount: (bt) => String(bt.amount),
              status: (bt) => bt.status === "pending" ? "قيد المراجعة" : bt.status === "approved" ? "تمت الموافقة" : "مرفوض",
              created_at: (bt) => bt.created_at?.slice(0, 10) || "",
            };
            const active = bankTransferExportCols.filter(c => cols.includes(c.key));
            return { headers: active.map(c => c.label), rows: rows.map((bt: any) => active.map(c => colMap[c.key]?.(bt) ?? "")) };
          }}
        />
      </div>
    </DashboardLayout>
  );
}
