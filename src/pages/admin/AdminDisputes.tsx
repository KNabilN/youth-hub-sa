import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminDisputes } from "@/hooks/useAdminDisputes";
import { DisputeCard } from "@/components/admin/DisputeCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { disputeStatusLabels, allDisputeStatuses } from "@/lib/dispute-statuses";
import { Gavel } from "lucide-react";

export default function AdminDisputes() {
  const { data: disputes, isLoading } = useAdminDisputes();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (disputes ?? []).filter((d: any) => statusFilter === "all" || d.status === statusFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <Gavel className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">إدارة النزاعات</h1>
              <p className="text-sm text-muted-foreground">{filtered.length} نزاع</p>
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {allDisputeStatuses.map(s => (
                <SelectItem key={s} value={s}>{disputeStatusLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

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
