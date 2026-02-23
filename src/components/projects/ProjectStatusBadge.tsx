import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  draft: { label: "مسودة", className: "bg-muted text-muted-foreground" },
  open: { label: "مفتوح", className: "bg-info/15 text-info border-info/30" },
  in_progress: { label: "قيد التنفيذ", className: "bg-warning/15 text-warning border-warning/30" },
  completed: { label: "مكتمل", className: "bg-success/15 text-success border-success/30" },
  disputed: { label: "متنازع", className: "bg-destructive/15 text-destructive border-destructive/30" },
  cancelled: { label: "ملغي", className: "bg-muted text-muted-foreground" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
