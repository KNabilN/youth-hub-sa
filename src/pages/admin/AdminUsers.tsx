import { DashboardLayout } from "@/components/DashboardLayout";
import { UserTable } from "@/components/admin/UserTable";

export default function AdminUsers() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <UserTable />
      </div>
    </DashboardLayout>
  );
}
