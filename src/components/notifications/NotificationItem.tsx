import { Bell, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface NotificationItemProps {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  onMarkRead: (id: string) => void;
}

const typeIcons: Record<string, typeof Bell> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
};

export function NotificationItem({ id, message, type, is_read, created_at, onMarkRead }: NotificationItemProps) {
  const Icon = typeIcons[type] || Bell;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${is_read ? "bg-card" : "bg-accent/30 border-primary/20"}`}>
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${is_read ? "text-muted-foreground" : "text-primary"}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${is_read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ar })}
        </p>
      </div>
      {!is_read && (
        <Button variant="ghost" size="sm" onClick={() => onMarkRead(id)} className="shrink-0">
          تم القراءة
        </Button>
      )}
    </div>
  );
}
