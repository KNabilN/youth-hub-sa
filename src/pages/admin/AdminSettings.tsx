import { DashboardLayout } from "@/components/DashboardLayout";
import { CommissionForm } from "@/components/admin/CommissionForm";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { RegionManager } from "@/components/admin/RegionManager";

export default function AdminSettings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">إعدادات المنصة</h1>
        <div className="grid gap-6 lg:grid-cols-2">
          <CommissionForm />
          <div className="space-y-6">
            <CategoryManager />
            <RegionManager />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
