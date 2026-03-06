import { DashboardLayout } from "@/components/DashboardLayout";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications(0, 49);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Bell className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الإشعارات</h1>
              <p className="text-sm text-muted-foreground">تابع جميع التحديثات والتنبيهات</p>
            </div>
          </div>
          {(notifications?.length ?? 0) > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
              <CheckCheck className="h-4 w-4 me-2" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : !notifications?.length ? (
          <EmptyState icon={Bell} title="لا توجد إشعارات" description="ستظهر إشعاراتك هنا عند حدوث تحديثات" />
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
                entity_id={n.entity_id}
                entity_type={n.entity_type}
                onMarkRead={() => markAsRead.mutate(n.id)}
                onDelete={() => deleteNotification.mutate(n.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
