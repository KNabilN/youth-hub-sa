import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects"> & {
  categories: Tables<"categories"> | null;
  regions: Tables<"regions"> | null;
};

const statusBorderColors: Record<string, string> = {
  draft: "border-t-muted-foreground/30",
  open: "border-t-info",
  in_progress: "border-t-warning",
  completed: "border-t-success",
  disputed: "border-t-destructive",
  cancelled: "border-t-muted-foreground/50",
};

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const borderColor = statusBorderColors[project.status] || "border-t-border";

  return (
    <Card className={`card-hover border-t-4 ${borderColor}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="space-y-1 min-w-0">
          <CardTitle className="text-base truncate">{project.title}</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {project.categories?.name && <span>{project.categories.name}</span>}
            {project.regions?.name && <span>• {project.regions.name}</span>}
          </div>
        </div>
        <ProjectStatusBadge status={project.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        <div className="flex items-center justify-between text-sm">
          {project.budget && (
            <span className="font-semibold text-primary">{project.budget.toLocaleString()} ر.س</span>
          )}
          {project.estimated_hours && <span className="text-muted-foreground">{project.estimated_hours} ساعة</span>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/projects/${project.id}`)}>
            <Eye className="h-3.5 w-3.5 ml-1" />
            عرض
          </Button>
          {project.status === "draft" && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${project.id}/edit`)}>
              <Pencil className="h-3.5 w-3.5 ml-1" />
              تعديل
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
