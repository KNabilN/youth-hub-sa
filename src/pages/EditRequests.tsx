import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyEditRequests } from "@/hooks/useEditRequests";
import { EditRequestCard } from "@/components/edit-requests/EditRequestCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { FileEdit } from "lucide-react";

export default function EditRequests() {
  const { data: requests, isLoading } = useMyEditRequests();

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const others = (requests ?? []).filter((r) => r.status !== "pending");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">طلبات التعديل</h1>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : pending.length === 0 && others.length === 0 ? (
          <EmptyState
            icon={FileEdit}
            title="لا توجد طلبات تعديل"
            description="ستظهر هنا طلبات التعديل المرسلة من المدير"
          />
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">قيد الانتظار ({pending.length})</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pending.map((r) => (
                    <EditRequestCard key={r.id} request={r} />
                  ))}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-muted-foreground">السابقة</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {others.map((r) => (
                    <EditRequestCard key={r.id} request={r} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
