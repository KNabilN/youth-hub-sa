import { DashboardLayout } from "@/components/DashboardLayout";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

export default function Notifications() {
  const pagination = usePagination();
  const { data: notifications, isLoading } = useNotifications(pagination.from, pagination.to);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const hasUnread = notifications?.some((n) => !n.is_read);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <Bell className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الإشعارات</h1>
              <p className="text-sm text-muted-foreground">جميع الإشعارات والتنبيهات</p>
            </div>
          </div>
          {hasUnread && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
              <CheckCheck className="ml-2 h-4 w-4" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : !notifications?.length ? (
          <EmptyState icon={Bell} title="لا توجد إشعارات" description="ستظهر الإشعارات هنا عند حدوث تحديثات" />
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

        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalFetched={notifications?.length ?? 0}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
        />
      </div>
    </DashboardLayout>
  );
}
