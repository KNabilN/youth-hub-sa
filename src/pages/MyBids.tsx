import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProviderBids, useWithdrawBid } from "@/hooks/useProviderBids";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "قيد المراجعة", variant: "secondary" },
  accepted: { label: "مقبول", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
  withdrawn: { label: "تم السحب", variant: "outline" },
};

export default function MyBids() {
  const [filter, setFilter] = useState("all");
  const { data: bids, isLoading } = useProviderBids(filter);
  const withdrawBid = useWithdrawBid();
  const { toast } = useToast();

  const handleWithdraw = (id: string) => {
    withdrawBid.mutate(id, {
      onSuccess: () => toast({ title: "تم سحب العرض" }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">عروضي</h1>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">قيد المراجعة</SelectItem>
            <SelectItem value="accepted">مقبول</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
            <SelectItem value="withdrawn">تم السحب</SelectItem>
          </SelectContent>
        </Select>

        {isLoading ? (
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        ) : !bids?.length ? (
          <p className="text-muted-foreground">لم تقدم أي عروض بعد</p>
        ) : (
          <div className="space-y-3">
            {bids.map(bid => {
              const st = statusLabels[bid.status] ?? statusLabels.pending;
              return (
                <Card key={bid.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base">{bid.projects?.title ?? "—"}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(bid.created_at).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm">
                        <span>السعر: {bid.price} ر.س</span>
                        <span>المدة: {bid.timeline_days} يوم</span>
                      </div>
                      {bid.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => handleWithdraw(bid.id)}>
                          سحب العرض
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
