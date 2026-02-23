import { DashboardLayout } from "@/components/DashboardLayout";
import { UserTable } from "@/components/admin/UserTable";
import { usePagination } from "@/hooks/usePagination";

export default function AdminUsers() {
  const pagination = usePagination();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <UserTable pagination={pagination} />
      </div>
    </DashboardLayout>
  );
}
