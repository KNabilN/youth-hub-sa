import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProjects, useUpdateProjectStatusByAssociation } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Plus, FolderKanban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";

export default function Projects() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: projects, isLoading } = useProjects(statusFilter);
  const updateStatus = useUpdateProjectStatusByAssociation();
  const navigate = useNavigate();

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
            <span className="text-sm font-medium text-muted-foreground">تصفية حسب الحالة</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        ) : !projects?.length ? (
          <EmptyState
            icon={FolderKanban}
            title="لا توجد طلبات حتى الآن"
            description="أنشئ أول طلب لبدء العمل مع مقدمي الخدمات"
            actionLabel="إنشاء أول طلب"
            onAction={() => navigate("/projects/new")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p as any}
                onSubmitForApproval={(id) => handleStatusChange(id, "pending_approval")}
                onSuspend={(id) => handleStatusChange(id, "suspended")}
                onReactivate={(id) => handleStatusChange(id, "pending_approval")}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
