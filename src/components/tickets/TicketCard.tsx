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
  open: "bg-blue-500/10 text-blue-700 border-blue-200",
  in_progress: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  resolved: "bg-green-500/10 text-green-700 border-green-200",
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
  medium: "bg-blue-500/10 text-blue-700",
  high: "bg-orange-500/10 text-orange-700",
  urgent: "bg-destructive/10 text-destructive",
};

interface TicketCardProps {
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  ticket_number?: string;
}

export function TicketCard({ subject, description, status, priority, created_at, ticket_number }: TicketCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            {ticket_number && <span className="text-xs font-mono text-muted-foreground">{ticket_number}</span>}
            <CardTitle className="text-base">{subject}</CardTitle>
          </div>
          <div className="flex gap-2 shrink-0">
            <Badge variant="outline" className={priorityColors[priority]}>{priorityLabels[priority]}</Badge>
            <Badge variant="outline" className={statusColors[status]}>{statusLabels[status]}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ar })}
        </p>
      </CardContent>
    </Card>
  );
}
