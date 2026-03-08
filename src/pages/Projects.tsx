import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProjects, useUpdateProjectStatusByAssociation } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Plus, FolderKanban, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { PaginationControls } from "@/components/PaginationControls";
import { usePagination } from "@/hooks/usePagination";

export default function Projects() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: projects, isLoading } = useProjects(statusFilter);
  const updateStatus = useUpdateProjectStatusByAssociation();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p: any) =>
      p.title?.toLowerCase().includes(q) || p.request_number?.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const { page, pageSize, nextPage, prevPage, resetPage } = usePagination();
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleStatusChange = (id: string, status: "draft" | "pending_approval" | "suspended" | "cancelled") => {
    const labels: Record<string, string> = {
      pending_approval: "تم تقديم المشروع للموافقة",
      suspended: "تم إيقاف المشروع مؤقتاً",
    };
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast({ title: labels[status] || "تم تحديث الحالة" }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <FolderKanban className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">طلبات الجمعيات</h1>
              <p className="text-sm text-muted-foreground">إدارة طلبات الجمعية</p>
            </div>
          </div>
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="h-4 w-4 me-1" />
            طلب جديد
          </Button>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالعنوان أو رقم الطلب..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); resetPage(); }}
                className="ps-9 bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); resetPage(); }}>
              <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="حالة المشروع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="pending_approval">بانتظار الموافقة</SelectItem>
                <SelectItem value="open">مفتوح</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="disputed">مُشتكى عليه</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
                <SelectItem value="suspended">معلق</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : !filtered.length ? (
          <EmptyState
            icon={FolderKanban}
            title={searchQuery ? "لا توجد نتائج" : "لا توجد طلبات حتى الآن"}
            description={searchQuery ? "جرّب تعديل كلمات البحث" : "أنشئ أول طلب لبدء العمل مع مقدمي الخدمات"}
            actionLabel={searchQuery ? undefined : "إنشاء أول طلب"}
            onAction={searchQuery ? undefined : () => navigate("/projects/new")}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((p: any) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onSubmitForApproval={(id) => handleStatusChange(id, "pending_approval")}
                  onSuspend={(id) => handleStatusChange(id, "suspended")}
                  onReactivate={(id) => handleStatusChange(id, "pending_approval")}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onNext={nextPage}
                onPrev={prevPage}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
