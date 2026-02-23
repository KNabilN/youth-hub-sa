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
import { Link } from "react-router-dom";
import { FolderKanban, ArrowLeft } from "lucide-react";

export default function MyProjects() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: projects, isLoading } = useMyAssignedProjects(statusFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">مشاريعي</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المشاريع</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="disputed">متنازع عليها</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : !projects?.length ? (
          <EmptyState icon={FolderKanban} title="لا توجد مشاريع" description="ستظهر مشاريعك هنا عند قبول عروضك" />
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
                        <ArrowLeft className="h-4 w-4 mr-1" />
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
