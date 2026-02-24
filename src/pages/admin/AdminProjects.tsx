import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminProjects, useUpdateProjectStatus } from "@/hooks/useAdminProjects";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";
import { FileEdit } from "lucide-react";
import { EditRequestDialog, type FieldConfig } from "@/components/admin/EditRequestDialog";
import type { Database } from "@/integrations/supabase/types";

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

const projectFields: FieldConfig[] = [
  { key: "title", label: "العنوان" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "budget", label: "الميزانية", type: "number" },
];

export default function AdminProjects() {
  const pagination = usePagination();
  const { data: projects, isLoading } = useAdminProjects(pagination.from, pagination.to);
  const updateStatus = useUpdateProjectStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editProject, setEditProject] = useState<any>(null);

  const filtered = (projects ?? []).filter((p: any) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
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
        <h1 className="text-2xl font-bold">نظرة عامة على المشاريع</h1>
        <div className="flex flex-wrap gap-3">
          <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? <p className="text-muted-foreground text-center py-8">جارٍ التحميل...</p> : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الجمعية</TableHead>
                    <TableHead>التصنيف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>تغيير الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{p.profiles?.full_name ?? "—"}</TableCell>
                      <TableCell>{p.categories?.name ?? "—"}</TableCell>
                      <TableCell><Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(p.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={(v) => handleStatusChange(p.id, v as ProjectStatus)}>
                          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setEditProject(p)}>
                          <FileEdit className="h-4 w-4 ml-1" />طلب تعديل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد مشاريع</TableCell></TableRow>}
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
        <EditRequestDialog
          open={!!editProject}
          onOpenChange={(o) => !o && setEditProject(null)}
          targetTable="projects"
          targetId={editProject.id}
          targetUserId={editProject.association_id}
          currentValues={editProject}
          fields={projectFields}
          title="طلب تعديل المشروع"
        />
      )}
    </DashboardLayout>
  );
}