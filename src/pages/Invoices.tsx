import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, Download, StickyNote } from "lucide-react";
import { generateInvoicePDF, type InvoiceData, type InvoiceTemplateConfig } from "@/lib/zatca-invoice";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  issued: { label: "صادرة", variant: "default" },
  viewed: { label: "تم الاطلاع", variant: "secondary" },
};

export default function Invoices() {
  const { data: invoices, isLoading } = useMyInvoices();
  const { data: profile } = useProfile();
  const { data: templateContent } = useSiteContent("invoice_template");
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [notesDialog, setNotesDialog] = useState<{ open: boolean; invoice: any | null }>({ open: false, invoice: null });
  const [notesText, setNotesText] = useState("");

  // Mark all issued invoices as viewed on page load
  useState(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("invoices")
        .update({ status: "viewed" } as any)
        .eq("issued_to", user.id)
        .eq("status", "issued");
      queryClient.invalidateQueries({ queryKey: ["my-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-new-invoices"] });
    })();
  });

  const template = (templateContent?.content as unknown as InvoiceTemplateConfig) ?? undefined;

  const filtered = (invoices ?? []).filter((inv: any) => {
    if (statusFilter === "all") return true;
    const invStatus = (inv as any).status ?? "issued";
    return invStatus === statusFilter;
  });

  const handleDownloadPDF = async (inv: any) => {
    try {
      const escrow = inv.escrow_transactions;
      const hasProject = !!escrow?.project_id;
      const hasService = !!escrow?.service_id;
      const hasGrant = !!escrow?.grant_request_id;
      const invoiceType = hasProject ? "project" : hasService ? "service" : hasGrant ? "grant" : "other";
      const linkedEntityName = hasProject
        ? escrow?.projects?.title
        : hasService
        ? escrow?.micro_services?.title
        : undefined;

      const invoiceData: InvoiceData = {
        invoiceNumber: inv.invoice_number,
        amount: Number(inv.amount),
        commissionAmount: Number(inv.commission_amount),
        createdAt: inv.created_at,
        projectTitle: linkedEntityName ?? "—",
        recipientName: profile?.full_name ?? "—",
        invoiceType: invoiceType as any,
        linkedEntityName,
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

  const openNotesDialog = (inv: any) => {
    setNotesText((inv as any).notes ?? "");
    setNotesDialog({ open: true, invoice: inv });
  };

  const handleSaveNotes = async () => {
    if (!notesDialog.invoice) return;
    await supabase.from("invoices").update({ notes: notesText }).eq("id", notesDialog.invoice.id);
    queryClient.invalidateQueries({ queryKey: ["my-invoices"] });
    setNotesDialog({ open: false, invoice: null });
    toast.success("تم حفظ الملاحظات");
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
              <p className="text-sm text-muted-foreground">سجل الفواتير والعمولات الخاصة بطلباتك</p>
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="issued">صادرة</SelectItem>
              <SelectItem value="viewed">تم الاطلاع</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !filtered?.length ? (
          <EmptyState icon={Receipt} title="لا توجد فواتير" description="ستظهر الفواتير هنا بعد إتمام الطلبات" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الطلب/الخدمة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>العمولة</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv: any) => {
                    const invStatus = (inv as any).status ?? "issued";
                    const st = statusLabels[invStatus] ?? statusLabels.issued;
                    const escrow = inv.escrow_transactions;
                    const hasProject = !!escrow?.project_id;
                    const hasService = !!escrow?.service_id;
                    const hasGrant = !!escrow?.grant_request_id;
                    const typeLabel = hasProject ? "طلب" : hasService ? "خدمة" : hasGrant ? "منحة" : "أخرى";
                    const typeVariant = hasProject ? "default" : hasService ? "secondary" : hasGrant ? "outline" : "outline";
                    const entityName = hasProject ? escrow?.projects?.title : hasService ? escrow?.micro_services?.title : "—";
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                        <TableCell><Badge variant={typeVariant as any}>{typeLabel}</Badge></TableCell>
                        <TableCell>{entityName ?? "—"}</TableCell>
                        <TableCell>{Number(inv.amount).toLocaleString()} ر.س</TableCell>
                        <TableCell className="text-destructive">{Number(inv.commission_amount).toLocaleString()} ر.س</TableCell>
                        <TableCell className="font-semibold text-success">
                          {(Number(inv.amount) + Number(inv.commission_amount)).toLocaleString()} ر.س
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
                            <Button size="icon" variant="ghost" onClick={() => openNotesDialog(inv)} title="ملاحظات">
                              <StickyNote className="h-4 w-4" />
                            </Button>
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

        <Dialog open={notesDialog.open} onOpenChange={(open) => !open && setNotesDialog({ open: false, invoice: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ملاحظات الفاتورة</DialogTitle>
            </DialogHeader>
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="أضف ملاحظاتك هنا..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotesDialog({ open: false, invoice: null })}>إلغاء</Button>
              <Button onClick={handleSaveNotes}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
