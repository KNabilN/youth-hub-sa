import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const typeFilters = [
  { value: "all", label: "الكل" },
  { value: "info", label: "عام" },
  { value: "bid", label: "العروض" },
  { value: "contract", label: "العقود" },
  { value: "escrow", label: "الضمان" },
  { value: "project", label: "المشاريع" },
  { value: "dispute", label: "المنازعات" },
  { value: "timelog", label: "سجل الوقت" },
  { value: "withdrawal", label: "السحب" },
];

export default function Notifications() {
  const pagination = usePagination();
  const { data: notifications, isLoading } = useNotifications(pagination.from, pagination.to);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const [filter, setFilter] = useState("all");

  const hasUnread = notifications?.some((n) => !n.is_read);
  const filtered = filter === "all" ? notifications : notifications?.filter((n) => n.type.startsWith(filter));

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

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex-wrap h-auto gap-1">
            {typeFilters.map((f) => (
              <TabsTrigger key={f.value} value={f.value} className="text-xs">{f.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : !filtered?.length ? (
          <EmptyState icon={Bell} title="لا توجد إشعارات" description="ستظهر الإشعارات هنا عند حدوث تحديثات" />
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                message={n.message}
                type={n.type}
                is_read={n.is_read}
                created_at={n.created_at}
                onMarkRead={(id) => markAsRead.mutate(id)}
                onDelete={(id) => deleteNotification.mutate(id)}
              />
            ))}
          </div>
        )}

        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalFetched={filtered?.length ?? 0}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
        />
      </div>
    </DashboardLayout>
  );
}
