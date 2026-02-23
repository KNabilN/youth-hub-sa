import { useUnreadCount } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";

export function NotificationBadge() {
  const { data: count } = useUnreadCount();
  if (!count || count === 0) return null;
  return (
    <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs rounded-full">
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
