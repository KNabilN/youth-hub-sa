import { useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminTickets, useUpdateTicketStatus } from "@/hooks/useAdminTickets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { useSoftDelete } from "@/hooks/useTrash";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { ExportDialog, type ExportColumnDef } from "@/components/admin/ExportDialog";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const ticketExportColumns: ExportColumnDef[] = [
  { key: "ticket_number", label: "رقم التذكرة" },
  { key: "subject", label: "الموضوع" },
  { key: "user", label: "المستخدم" },
  { key: "priority", label: "الأولوية" },
  { key: "status", label: "الحالة" },
  { key: "created_at", label: "التاريخ" },
];
const ticketExportDefaults = ["ticket_number", "subject", "user", "priority", "status", "created_at"];

const statusLabels: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-yellow-500/10 text-yellow-600",
  resolved: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-destructive/10 text-destructive",
};

export default function AdminTickets() {
  
  const { data: tickets, isLoading } = useAdminTickets();
  const updateStatus = useUpdateTicketStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const softDelete = useSoftDelete();

  const filtered = (tickets ?? []).filter((t: any) => {
    const q = search.toLowerCase();
    if (search && !t.subject.toLowerCase().includes(q) && !(t.ticket_number ?? '').toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = (id: string, status: TicketStatus) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast.success("تم تحديث حالة التذكرة"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">تذاكر الدعم الفني</h1>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">البحث</Label>
            <Input placeholder="بحث بالموضوع أو الرقم..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">الحالة</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
          >
            إعادة تعيين
          </Button>
          <Button variant="outline" size="sm" className="h-10 gap-1" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" />تصدير CSV
          </Button>
        </div>
        {isLoading ? (
          <div className="border rounded-lg p-4 space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>رقم التذكرة</TableHead>
                   <TableHead>الموضوع</TableHead>
                   <TableHead>المستخدم</TableHead>
                   <TableHead>الأولوية</TableHead>
                   <TableHead>الحالة</TableHead>
                   <TableHead>التاريخ</TableHead>
                   <TableHead>تغيير الحالة</TableHead>
                   <TableHead>إجراءات</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t: any) => (
                   <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm font-semibold">
                        <Link to={`/admin/tickets/${t.id}`} className="hover:underline hover:text-primary transition-colors">{t.ticket_number}</Link>
                      </TableCell>
                     <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell>{t.profiles?.organization_name || t.profiles?.full_name || "—"}</TableCell>
                    <TableCell><Badge className={priorityColors[t.priority]}>{priorityLabels[t.priority]}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(t.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v as TicketStatus)}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(t)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد تذاكر</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="تصدير التذاكر"
        filename="tickets.csv"
        columns={ticketExportColumns}
        defaultColumns={ticketExportDefaults}
        filters={[
          { key: "status", label: "فلتر حسب الحالة", options: Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v })) },
          { key: "priority", label: "فلتر حسب الأولوية", options: Object.entries(priorityLabels).map(([k, v]) => ({ value: k, label: v })) },
        ]}
        onExport={async (cols, filters) => {
          const { data } = await supabase.from("support_tickets").select("ticket_number, subject, priority, status, created_at, profiles!support_tickets_user_id_fkey(full_name, organization_name)");
          let rows = data ?? [];
          if (filters.status !== "all") rows = rows.filter((t: any) => t.status === filters.status);
          if (filters.priority !== "all") rows = rows.filter((t: any) => t.priority === filters.priority);
          const colMap: Record<string, (t: any) => string> = {
            ticket_number: (t) => t.ticket_number || "",
            subject: (t) => t.subject || "",
            user: (t) => (t.profiles as any)?.organization_name || (t.profiles as any)?.full_name || "",
            priority: (t) => priorityLabels[t.priority] || t.priority,
            status: (t) => statusLabels[t.status] || t.status,
            created_at: (t) => t.created_at?.slice(0, 10) || "",
          };
          const activeCols = ticketExportColumns.filter((c) => cols.includes(c.key));
          return {
            headers: activeCols.map((c) => c.label),
            rows: rows.map((t: any) => activeCols.map((c) => colMap[c.key]?.(t) ?? "")),
          };
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="نقل إلى سلة المحذوفات"
        description={`سيتم نقل التذكرة "${deleteTarget?.ticket_number || deleteTarget?.subject || "—"}" إلى سلة المحذوفات.`}
        confirmLabel="نقل للسلة"
        variant="destructive"
        loading={softDelete.isPending}
        onConfirm={() => {
          softDelete.mutate({ table: "support_tickets", id: deleteTarget.id }, {
            onSuccess: () => { toast.success("تم النقل إلى سلة المحذوفات"); setDeleteTarget(null); },
            onError: () => toast.error("حدث خطأ"),
          });
        }}
      />
    </DashboardLayout>
  );
}
