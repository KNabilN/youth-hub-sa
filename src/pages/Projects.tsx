import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export default function Projects() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: projects, isLoading } = useProjects(statusFilter);
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">المشاريع</h1>
            <p className="text-sm text-muted-foreground mt-1">إدارة مشاريع الجمعية</p>
          </div>
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="h-4 w-4 ml-1" />
            مشروع جديد
          </Button>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="حالة المشروع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="open">مفتوح</SelectItem>
            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="disputed">متنازع</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : !projects?.length ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">لا توجد مشاريع حتى الآن</p>
            <Button className="mt-4" onClick={() => navigate("/projects/new")}>إنشاء أول مشروع</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => <ProjectCard key={p.id} project={p as any} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
