import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminProjects, useUpdateProjectStatus, useAdminUpdateProject, useToggleProjectNameVisibility } from "@/hooks/useAdminProjects";
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
import { FileEdit, Eye, Download, Trash2 } from "lucide-react";
import { useSoftDelete } from "@/hooks/useTrash";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { AdminDirectEditDialog, type DirectEditFieldConfig } from "@/components/admin/AdminDirectEditDialog";
import { useCategories } from "@/hooks/useCategories";
import type { Database } from "@/integrations/supabase/types";
import { ExportDialog, type ExportColumnDef } from "@/components/admin/ExportDialog";

const projectExportColumns: ExportColumnDef[] = [
  { key: "request_number", label: "رقم الطلب" },
  { key: "title", label: "العنوان" },
  { key: "association", label: "الجمعية" },
  { key: "category", label: "التصنيف" },
  { key: "region", label: "المنطقة" },
  { key: "city", label: "المدينة" },
  { key: "budget", label: "الميزانية" },
  { key: "status", label: "الحالة" },
  { key: "created_at", label: "التاريخ" },
];
const projectExportDefaults = ["request_number", "title", "association", "category", "status", "budget", "created_at"];

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const statusLabels: Record<string, string> = {
  draft: "مسودة", pending_approval: "بانتظار الموافقة", open: "مفتوح", in_progress: "قيد التنفيذ",
  completed: "مكتمل", disputed: "متنازع", cancelled: "ملغي",
  suspended: "معلق", archived: "مؤرشف",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", pending_approval: "bg-orange-500/10 text-orange-600",
  open: "bg-primary/10 text-primary", in_progress: "bg-yellow-500/10 text-yellow-600",
  completed: "bg-emerald-500/10 text-emerald-600", disputed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  suspended: "bg-orange-500/10 text-orange-600", archived: "bg-muted text-muted-foreground",
};

const projectFields: DirectEditFieldConfig[] = [
  { key: "title", label: "العنوان" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "budget", label: "الميزانية", type: "number" },
  { key: "category_id", label: "التصنيف", type: "select", selectSource: "categories" },
  { key: "region_id", label: "المنطقة", type: "select", selectSource: "regions" },
];

export default function AdminProjects() {
  const pagination = usePagination();
  const { data: projects, isLoading } = useAdminProjects(pagination.from, pagination.to);
  const { data: categories } = useCategories();
  const updateStatus = useUpdateProjectStatus();
  const updateProject = useAdminUpdateProject();
  const toggleVisibility = useToggleProjectNameVisibility();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editProject, setEditProject] = useState<any>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const softDelete = useSoftDelete();

  const filtered = (projects ?? []).filter((p: any) => {
    const q = search.toLowerCase();
    if (search && !p.title.toLowerCase().includes(q) && !(p.request_number ?? '').toLowerCase().includes(q) && !(p.profiles?.full_name || "").toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
    return true;
  });

  const handleStatusChange = (id: string, status: ProjectStatus) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast.success("تم تحديث الحالة"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">نظرة عامة على طلبات الجمعيات</h1>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">البحث</Label>
            <Input placeholder="بحث بالعنوان أو الجمعية..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">التصنيف</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="التصنيف" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {(categories ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }}
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
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الجمعية</TableHead>
                    <TableHead>إظهار الاسم</TableHead>
                     <TableHead>التصنيف</TableHead>
                     <TableHead>مميز</TableHead>
                     <TableHead>الحالة</TableHead>
                     <TableHead>التاريخ</TableHead>
                     <TableHead>تغيير الحالة</TableHead>
                     <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm font-semibold">
                        <Link to={`/admin/projects/${p.id}`} className="hover:underline hover:text-primary transition-colors">{p.request_number}</Link>
                      </TableCell>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{p.profiles?.full_name ?? "—"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={(p as any).is_name_visible ?? true}
                          onCheckedChange={(checked) => {
                            toggleVisibility.mutate({ projectId: p.id, visible: checked }, {
                              onSuccess: () => toast.success(checked ? "تم إظهار اسم الجمعية" : "تم إخفاء اسم الجمعية"),
                              onError: () => toast.error("حدث خطأ"),
                            });
                          }}
                        />
                      </TableCell>
                       <TableCell>{p.categories?.name ?? "—"}</TableCell>
                       <TableCell>
                         <Switch
                           checked={(p as any).is_featured ?? false}
                           onCheckedChange={(checked) => {
                             updateProject.mutate(
                               { id: p.id, is_featured: checked },
                               {
                                 onSuccess: () => toast.success(checked ? "تم تمييز الطلب" : "تم إلغاء التمييز"),
                                 onError: () => toast.error("حدث خطأ"),
                               }
                             );
                           }}
                         />
                       </TableCell>
                       <TableCell><Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(p.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                      <TableCell>
                        {(() => {
                          const opts = getAdminAllowedStatuses(p.status);
                          return opts.length > 0 ? (
                            <Select value={p.status} onValueChange={(v) => handleStatusChange(p.id, v as ProjectStatus)}>
                              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value={p.status}>{statusLabels[p.status]}</SelectItem>
                                {opts.map((k) => <SelectItem key={k} value={k}>{statusLabels[k]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/projects/${p.id}`}><Eye className="h-4 w-4 me-1" />عرض</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditProject(p)}>
                          <FileEdit className="h-4 w-4 me-1" />تعديل
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalFetched={projects?.length ?? 0}
              onPrev={pagination.prevPage}
              onNext={pagination.nextPage}
            />
          </>
        )}
      </div>

      {editProject && (
        <AdminDirectEditDialog
          open={!!editProject}
          onOpenChange={(o) => !o && setEditProject(null)}
          currentValues={editProject}
          fields={projectFields}
          title="تعديل الطلب"
          isPending={updateProject.isPending}
          onSave={async (updates) => {
            await updateProject.mutateAsync({ id: editProject.id, ...updates });
          }}
        />
      )}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="تصدير الطلبات"
        filename="projects.csv"
        columns={projectExportColumns}
        defaultColumns={projectExportDefaults}
        filters={[{
          key: "status",
          label: "فلتر حسب الحالة",
          options: Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v })),
        }]}
        onExport={async (cols, filters) => {
          const { data } = await supabase.from("projects").select("request_number, title, budget, status, created_at, profiles!projects_association_id_fkey(full_name), categories(name), regions(name), cities(name)");
          let rows = data ?? [];
          if (filters.status !== "all") rows = rows.filter((p: any) => p.status === filters.status);
          const colMap: Record<string, (p: any) => string> = {
            request_number: (p) => p.request_number || "",
            title: (p) => p.title || "",
            association: (p) => (p.profiles as any)?.full_name || "",
            category: (p) => (p.categories as any)?.name || "",
            region: (p) => (p.regions as any)?.name || "",
            city: (p) => (p.cities as any)?.name || "",
            budget: (p) => p.budget != null ? String(p.budget) : "",
            status: (p) => statusLabels[p.status] || p.status,
            created_at: (p) => p.created_at?.slice(0, 10) || "",
          };
          const activeCols = projectExportColumns.filter((c) => cols.includes(c.key));
          return {
            headers: activeCols.map((c) => c.label),
            rows: rows.map((p: any) => activeCols.map((c) => colMap[c.key]?.(p) ?? "")),
          };
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="نقل إلى سلة المحذوفات"
        description={`سيتم نقل الطلب "${deleteTarget?.title}" إلى سلة المحذوفات.`}
        confirmLabel="نقل للسلة"
        variant="destructive"
        loading={softDelete.isPending}
        onConfirm={() => {
          softDelete.mutate({ table: "projects", id: deleteTarget.id }, {
            onSuccess: () => { toast.success("تم النقل إلى سلة المحذوفات"); setDeleteTarget(null); },
            onError: () => toast.error("حدث خطأ"),
          });
        }}
      />
    </DashboardLayout>
  );
}
