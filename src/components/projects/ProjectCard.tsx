import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Pause, Play, Send, MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects"> & {
  categories: Tables<"categories"> | null;
  regions: Tables<"regions"> | null;
  bids?: { id: string; status: string }[] | null;
};

const statusBorderColors: Record<string, string> = {
  draft: "border-t-muted-foreground/30",
  pending_approval: "border-t-orange-500",
  open: "border-t-info",
  in_progress: "border-t-warning",
  completed: "border-t-success",
  disputed: "border-t-destructive",
  cancelled: "border-t-muted-foreground/50",
  suspended: "border-t-orange-500",
  archived: "border-t-muted-foreground/50",
};

interface ProjectCardProps {
  project: Project;
  onSuspend?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onSubmitForApproval?: (id: string) => void;
}

export function ProjectCard({ project, onSuspend, onReactivate, onSubmitForApproval }: ProjectCardProps) {
  const navigate = useNavigate();
  const borderColor = statusBorderColors[project.status] || "border-t-border";
  const pendingBidsCount = (project.bids ?? []).filter(b => b.status === "pending").length;

  return (
    <Card className={`card-hover border-t-4 ${borderColor}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
         <div className="space-y-1 min-w-0">
           {(project as any).request_number && <span className="text-xs font-mono text-muted-foreground">{(project as any).request_number}</span>}
           <div className="flex items-center gap-2">
             <CardTitle className="text-base truncate">{project.title}</CardTitle>
             {pendingBidsCount > 0 && (
               <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full flex items-center gap-0.5 shrink-0">
                 <MessageSquare className="h-3 w-3" />
                 {pendingBidsCount}
               </Badge>
             )}
           </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {project.categories?.name && <span>{project.categories.name}</span>}
            {project.regions?.name && <span>• {project.regions.name}</span>}
            {(project as any).cities?.name && <span>• {(project as any).cities.name}</span>}
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
        {pendingBidsCount > 0 && (
          <div className="text-xs text-primary font-medium bg-primary/5 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {pendingBidsCount} {pendingBidsCount === 1 ? "عرض جديد" : "عروض جديدة"} بانتظار المراجعة
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/projects/${project.id}`)}>
            <Eye className="h-3.5 w-3.5 me-1" />
            عرض
          </Button>
          {project.status === "draft" && (
            <>
              <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5 me-1" />
                تعديل
              </Button>
              {onSubmitForApproval && (
                <Button size="sm" onClick={() => onSubmitForApproval(project.id)}>
                  <Send className="h-3.5 w-3.5 me-1" />
                  تقديم للموافقة
                </Button>
              )}
            </>
          )}
          {(project.status === "open" || project.status === "pending_approval") && onSuspend && (
            <Button size="sm" variant="outline" className="text-orange-600 hover:bg-orange-500/10" onClick={() => onSuspend(project.id)}>
              <Pause className="h-3.5 w-3.5 me-1" />
              إيقاف
            </Button>
          )}
          {(project.status === "suspended" || project.status === "cancelled") && onReactivate && (
            <Button size="sm" variant="outline" className="text-emerald-600 hover:bg-emerald-500/10" onClick={() => onReactivate(project.id)}>
              <Play className="h-3.5 w-3.5 me-1" />
              إعادة تقديم
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
