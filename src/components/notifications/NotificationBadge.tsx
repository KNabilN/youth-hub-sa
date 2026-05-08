import { useUnreadCount } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";

export function NotificationBadge() {
  const { data: count } = useUnreadCount();
  if (!count || count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[11px] font-bold text-destructive-foreground bg-destructive rounded-full shadow-sm animate-scale-in pointer-events-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}
