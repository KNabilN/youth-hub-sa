import { DashboardLayout } from "@/components/DashboardLayout";
import { CommissionForm } from "@/components/admin/CommissionForm";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { RegionManager } from "@/components/admin/RegionManager";
import { InvoiceTemplateManager } from "@/components/admin/InvoiceTemplateManager";
import { PendingCategoriesManager } from "@/components/admin/PendingCategoriesManager";
import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إعدادات المنصة</h1>
            <p className="text-sm text-muted-foreground">إدارة العمولات والتصنيفات والمناطق وقالب الفاتورة</p>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <CommissionForm />
            <InvoiceTemplateManager />
          </div>
          <div className="space-y-6">
            <CategoryManager />
            <RegionManager />
            <PendingCategoriesManager />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
