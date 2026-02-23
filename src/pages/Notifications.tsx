import { DashboardLayout } from "@/components/DashboardLayout";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const hasUnread = notifications?.some((n) => !n.is_read);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">الإشعارات</h1>
            <p className="text-muted-foreground text-sm mt-1">جميع الإشعارات والتنبيهات</p>
          </div>
          {hasUnread && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
              <CheckCheck className="ml-2 h-4 w-4" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        ) : !notifications?.length ? (
          <p className="text-muted-foreground text-sm">لا توجد إشعارات</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                message={n.message}
                type={n.type}
                is_read={n.is_read}
                created_at={n.created_at}
                onMarkRead={(id) => markAsRead.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
