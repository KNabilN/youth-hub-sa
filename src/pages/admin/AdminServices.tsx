import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminServices } from "@/hooks/useAdminServices";
import { ServiceApprovalCard } from "@/components/admin/ServiceApprovalCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AdminServices() {
  const { data: services, isLoading } = useAdminServices();
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");

  const filtered = (services ?? []).filter((s: any) => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (approvalFilter !== "all" && s.approval !== approvalFilter) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
        <div className="flex flex-wrap gap-3">
          <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">قيد المراجعة</SelectItem>
              <SelectItem value="approved">مقبول</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading ? <p className="text-muted-foreground text-center py-8">جارٍ التحميل...</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((s: any) => <ServiceApprovalCard key={s.id} service={s} />)}
            {filtered.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">لا توجد خدمات</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
