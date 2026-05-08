import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPriority = Database["public"]["Enums"]["ticket_priority"];

const statusLabels: Record<TicketStatus, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

const statusColors: Record<TicketStatus, string> = {
  open: "bg-info/10 text-info border-info/30",
  in_progress: "bg-warning/10 text-warning border-warning/30",
  resolved: "bg-success/10 text-success border-success/30",
  closed: "bg-muted text-muted-foreground",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const priorityColors: Record<TicketPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-orange-500/10 text-orange-700",
  urgent: "bg-destructive/10 text-destructive",
};

interface TicketCardProps {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  ticket_number?: string;
  onClick?: () => void;
}

export function TicketCard({
  id,
  subject,
  description,
  status,
  priority,
  created_at,
  ticket_number,
  onClick,
}: TicketCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            {ticket_number && (
              <span className="text-xs font-mono text-muted-foreground">
                {ticket_number}
              </span>
            )}
            <CardTitle className="text-base">{subject}</CardTitle>
          </div>
          <div className="flex gap-2 shrink-0">
            <Badge variant="outline" className={priorityColors[priority]}>
              {priorityLabels[priority]}
            </Badge>
            <Badge variant="outline" className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(created_at), {
            addSuffix: true,
            locale: ar,
          })}
        </p>
      </CardContent>
    </Card>
  );
}
