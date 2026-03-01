import { useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminDisputes } from "@/hooks/useAdminDisputes";
import { DisputeCard } from "@/components/admin/DisputeCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
              <h1 className="text-2xl font-bold">إدارة الشكاوى</h1>
              <p className="text-sm text-muted-foreground">{filtered.length} شكوى</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">الحالة</Label>
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
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => setStatusFilter("all")}
            >
              إعادة تعيين
            </Button>
          </div>
        </div>

        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

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
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((d: any) => (
              <Link key={d.id} to={`/admin/disputes/${d.id}`} className="block transition-opacity hover:opacity-80">
                <DisputeCard dispute={d} />
              </Link>
            ))}
            {filtered.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">لا توجد شكاوى</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
