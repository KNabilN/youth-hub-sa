import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProviderBids, useWithdrawBid } from "@/hooks/useProviderBids";
import { useSignContract } from "@/hooks/useContracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, FileText, FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

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
  const signContract = useSignContract();
  const { toast } = useToast();

  // Fetch contracts for accepted bids
  const acceptedBidProjectIds = (bids ?? [])
    .filter((b: any) => b.status === "accepted")
    .map((b: any) => b.project_id);

  const { data: contracts } = useQuery({
    queryKey: ["provider-bid-contracts", acceptedBidProjectIds],
    enabled: acceptedBidProjectIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("*")
        .in("project_id", acceptedBidProjectIds);
      return data ?? [];
    },
  });

  const getContract = (projectId: string) =>
    (contracts ?? []).find((c: any) => c.project_id === projectId);

  const handleWithdraw = (id: string) => {
    withdrawBid.mutate(id, {
      onSuccess: () => toast({ title: "تم سحب العرض" }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleSign = (contractId: string) => {
    signContract.mutate(contractId, {
      onSuccess: () => toast({ title: "تم توقيع العقد بنجاح" }),
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
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : !bids?.length ? (
          <EmptyState icon={FolderKanban} title="لا توجد عروض" description="تصفح المشاريع المتاحة وقدم عرضك الأول" actionLabel="تصفح المشاريع" actionHref="/available-projects" />
        ) : (
          <div className="space-y-3">
            {bids.map((bid: any) => {
              const st = statusLabels[bid.status] ?? statusLabels.pending;
              const contract = bid.status === "accepted" ? getContract(bid.project_id) : null;
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
                      <div className="flex gap-2">
                        {bid.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => handleWithdraw(bid.id)}>
                            سحب العرض
                          </Button>
                        )}
                        {contract && !contract.provider_signed_at && (
                          <Button size="sm" onClick={() => handleSign(contract.id)} disabled={signContract.isPending}>
                            <Check className="h-4 w-4 ml-1" />
                            توقيع العقد
                          </Button>
                        )}
                        {contract?.provider_signed_at && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            تم التوقيع
                          </Badge>
                        )}
                      </div>
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
