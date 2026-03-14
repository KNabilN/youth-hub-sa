import { DashboardLayout } from "@/components/DashboardLayout";
import { UserTable } from "@/components/admin/UserTable";
import { usePagination } from "@/hooks/usePagination";
import { UserCog } from "lucide-react";

export default function AdminUsers() {
  const pagination = usePagination("admin-users");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <UserCog className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
              <p className="text-sm text-muted-foreground">عرض وإدارة جميع المستخدمين</p>
            </div>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />
        <UserTable pagination={pagination} />
      </div>
    </DashboardLayout>
  );
}
