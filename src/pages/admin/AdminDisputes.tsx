import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminDisputes } from "@/hooks/useAdminDisputes";
import { DisputeCard } from "@/components/admin/DisputeCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDisputes() {
  const { data: disputes, isLoading } = useAdminDisputes();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (disputes ?? []).filter((d: any) => statusFilter === "all" || d.status === statusFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">إدارة النزاعات</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="open">مفتوح</SelectItem>
            <SelectItem value="under_review">قيد المراجعة</SelectItem>
            <SelectItem value="resolved">تم الحل</SelectItem>
            <SelectItem value="closed">مغلق</SelectItem>
          </SelectContent>
        </Select>
        {isLoading ? <p className="text-muted-foreground text-center py-8">جارٍ التحميل...</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((d: any) => <DisputeCard key={d.id} dispute={d} />)}
            {filtered.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">لا توجد نزاعات</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
