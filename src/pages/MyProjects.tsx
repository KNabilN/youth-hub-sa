import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyAssignedProjects } from "@/hooks/useMyAssignedProjects";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FolderKanban, ArrowLeft } from "lucide-react";
import { useListHighlight } from "@/hooks/useListHighlight";

export default function MyProjects() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: projects, isLoading } = useMyAssignedProjects(statusFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Styled Page Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <FolderKanban className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">طلباتي</h1>
            <p className="text-sm text-muted-foreground">الطلبات المسندة إليك وحالتها الحالية</p>
          </div>
        </div>

        {/* Gradient Divider */}
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Filter Card */}
        <Card className="border-dashed">
          <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm font-medium text-muted-foreground">تصفية حسب الحالة</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="disputed">مُشتكى عليها</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : !projects?.length ? (
          <EmptyState icon={FolderKanban} title="لا توجد طلبات" description="ستظهر الطلبات هنا عند قبول عروضك" />
        ) : (
          <div className="grid gap-4">
            {projects.map((project: any) => (
              <Card key={project.id} className="card-hover">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-2 flex-wrap">
                      {project.budget && <Badge variant="secondary">{project.budget.toLocaleString()} ر.س</Badge>}
                      {project.categories?.name && <Badge variant="outline">{project.categories.name}</Badge>}
                      {project.regions?.name && <Badge variant="outline">{project.regions.name}</Badge>}
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/projects/${project.id}`}>
                        عرض التفاصيل
                        <ArrowLeft className="h-4 w-4 me-1 rtl:-scale-x-100" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
