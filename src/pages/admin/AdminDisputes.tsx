import { useState } from "react";
import { Link } from "react-router-dom";
import { useListHighlight } from "@/hooks/useListHighlight";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminDisputes, useUpdateDispute } from "@/hooks/useAdminDisputes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";
import { Eye, FileEdit, Download, Trash2, Gavel } from "lucide-react";
import { useSoftDelete } from "@/hooks/useTrash";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { AdminDirectEditDialog, type DirectEditFieldConfig } from "@/components/admin/AdminDirectEditDialog";
import { disputeStatusLabels, disputeStatusColors, allDisputeStatuses } from "@/lib/dispute-statuses";
import type { Database } from "@/integrations/supabase/types";
import { ExportDialog, type ExportColumnDef } from "@/components/admin/ExportDialog";

type DisputeStatus = Database["public"]["Enums"]["dispute_status"];

const disputeExportColumns: ExportColumnDef[] = [
  { key: "dispute_number", label: "رقم الشكوى" },
  { key: "project", label: "المشروع" },
  { key: "raised_by", label: "مقدم الشكوى" },
  { key: "description", label: "الوصف" },
  { key: "status", label: "الحالة" },
  { key: "created_at", label: "التاريخ" },
];
const disputeExportDefaults = ["dispute_number", "project", "raised_by", "status", "created_at"];

const disputeFields: DirectEditFieldConfig[] = [
  { key: "resolution_notes", label: "ملاحظات الحل", type: "textarea" },
];

export default function AdminDisputes() {
  const { saveAndNavigate } = useListHighlight("admin-disputes");
  const pagination = usePagination();
  const { data: disputes, isLoading } = useAdminDisputes();
  const updateDispute = useUpdateDispute();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editDispute, setEditDispute] = useState<any>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const softDelete = useSoftDelete();

  const filtered = (disputes ?? []).filter((d: any) => {
    if (search) {
      const q = search.toLowerCase();
      const title = d.projects?.title?.toLowerCase() ?? "";
      const name = d.profiles?.full_name?.toLowerCase() ?? "";
      const dn = (d.dispute_number || "").toLowerCase();
      if (!title.includes(q) && !name.includes(q) && !dn.includes(q)) return false;
    }
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  const paged = filtered.slice(pagination.from, pagination.to + 1);

  const handleStatusChange = (dispute: any, status: DisputeStatus) => {
    updateDispute.mutate(
      { id: dispute.id, status },
      {
        onSuccess: () => toast.success("تم تحديث الحالة"),
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <Gavel className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">إدارة الشكاوى</h1>
              <p className="text-sm text-muted-foreground">متابعة وحل النزاعات بين الأطراف</p>
            </div>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">البحث</Label>
            <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">الحالة</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {allDisputeStatuses.map(s => (
                  <SelectItem key={s} value={s}>{disputeStatusLabels[s]}</SelectItem>
                ))}
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
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>الرقم</TableHead>
                     <TableHead>المشروع</TableHead>
                    <TableHead>مقدم الشكوى</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>تغيير الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((d: any) => (
                    <TableRow key={d.id} id={`row-${d.id}`}>
                      <TableCell className="font-mono text-sm font-semibold">
                        <Link to={`/admin/disputes/${d.id}`} className="hover:underline hover:text-primary transition-colors">
                          {d.dispute_number || "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{d.projects?.title ?? "—"}</TableCell>
                      <TableCell>{d.profiles?.full_name ?? "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={d.description}>
                        {d.description?.length > 60 ? d.description.slice(0, 60) + "…" : d.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={disputeStatusColors[d.status]}>
                          {disputeStatusLabels[d.status] ?? d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(d.created_at), "yyyy/MM/dd", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Select value={d.status} onValueChange={(v) => handleStatusChange(d, v as DisputeStatus)}>
                          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {allDisputeStatuses.map(s => (
                              <SelectItem key={s} value={s}>{disputeStatusLabels[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/disputes/${d.id}`}><Eye className="h-4 w-4 me-1" />عرض</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditDispute(d)}>
                          <FileEdit className="h-4 w-4 me-1" />تعديل
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(d)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد شكاوى</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalFetched={paged.length}
              onPrev={pagination.prevPage}
              onNext={pagination.nextPage}
            />
          </>
        )}
      </div>

      {editDispute && (
        <AdminDirectEditDialog
          open={!!editDispute}
          onOpenChange={(o) => !o && setEditDispute(null)}
          currentValues={editDispute}
          fields={disputeFields}
          title="تعديل ملاحظات الشكوى"
          isPending={updateDispute.isPending}
          onSave={async (updates) => {
            await updateDispute.mutateAsync({
              id: editDispute.id,
              status: editDispute.status,
              resolution_notes: updates.resolution_notes,
            });
          }}
        />
      )}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="تصدير الشكاوى"
        filename="disputes.csv"
        columns={disputeExportColumns}
        defaultColumns={disputeExportDefaults}
        filters={[{
          key: "status",
          label: "فلتر حسب الحالة",
          options: allDisputeStatuses.map((s) => ({ value: s, label: disputeStatusLabels[s] })),
        }]}
        onExport={async (cols, filters) => {
          const { data } = await supabase.from("disputes").select("dispute_number, description, status, created_at, projects(title), profiles!disputes_raised_by_fkey(full_name)");
          let rows = data ?? [];
          if (filters.status !== "all") rows = rows.filter((d: any) => d.status === filters.status);
          const colMap: Record<string, (d: any) => string> = {
            dispute_number: (d) => d.dispute_number || "",
            project: (d) => (d.projects as any)?.title || "",
            raised_by: (d) => (d.profiles as any)?.full_name || "",
            description: (d) => d.description || "",
            status: (d) => disputeStatusLabels[d.status] || d.status,
            created_at: (d) => d.created_at?.slice(0, 10) || "",
          };
          const activeCols = disputeExportColumns.filter((c) => cols.includes(c.key));
          return {
            headers: activeCols.map((c) => c.label),
            rows: rows.map((d: any) => activeCols.map((c) => colMap[c.key]?.(d) ?? "")),
          };
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="نقل إلى سلة المحذوفات"
        description={`سيتم نقل الشكوى "${deleteTarget?.dispute_number}" إلى سلة المحذوفات.`}
        confirmLabel="نقل للسلة"
        variant="destructive"
        loading={softDelete.isPending}
        onConfirm={() => {
          softDelete.mutate({ table: "disputes", id: deleteTarget.id }, {
            onSuccess: () => { toast.success("تم النقل إلى سلة المحذوفات"); setDeleteTarget(null); },
            onError: () => toast.error("حدث خطأ"),
          });
        }}
      />
    </DashboardLayout>
  );
}
