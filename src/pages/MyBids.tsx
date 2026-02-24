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
import { Check, FileText, FolderKanban, Filter, DollarSign, CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; border: string }> = {
  pending: { label: "قيد المراجعة", variant: "secondary", border: "border-r-4 border-yellow-500" },
  accepted: { label: "مقبول", variant: "default", border: "border-r-4 border-emerald-500" },
  rejected: { label: "مرفوض", variant: "destructive", border: "border-r-4 border-red-500" },
  withdrawn: { label: "تم السحب", variant: "outline", border: "border-r-4 border-muted-foreground/40" },
};

export default function MyBids() {
  const [filter, setFilter] = useState("all");
  const { data: bids, isLoading } = useProviderBids(filter);
  const withdrawBid = useWithdrawBid();
  const signContract = useSignContract();
  const { toast } = useToast();

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
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">عروضي</h1>
            <p className="text-sm text-muted-foreground">تابع حالة عروضك المقدمة على المشاريع</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Filter Panel */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="accepted">مقبول</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
                <SelectItem value="withdrawn">تم السحب</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : !bids?.length ? (
          <EmptyState icon={FolderKanban} title="لا توجد عروض" description="تصفح المشاريع المتاحة وقدم عرضك الأول" actionLabel="تصفح المشاريع" actionHref="/available-projects" />
        ) : (
          <div className="space-y-3">
            {bids.map((bid: any) => {
              const st = statusLabels[bid.status] ?? statusLabels.pending;
              const contract = bid.status === "accepted" ? getContract(bid.project_id) : null;
              const needsSign = contract && !contract.provider_signed_at;
              return (
                <Card key={bid.id} className={`card-hover ${st.border} ${needsSign ? "ring-1 ring-primary/30 bg-primary/[0.02]" : ""}`}>
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
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex gap-3">
                        <span className="inline-flex items-center gap-1 text-sm bg-muted px-2.5 py-1 rounded-md">
                          <DollarSign className="h-3.5 w-3.5 text-primary" />{bid.price} ر.س
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm bg-muted px-2.5 py-1 rounded-md">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />{bid.timeline_days} يوم
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {bid.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => handleWithdraw(bid.id)}>
                            سحب العرض
                          </Button>
                        )}
                        {needsSign && (
                          <Button size="sm" onClick={() => handleSign(contract.id)} disabled={signContract.isPending} className="bg-gradient-to-l from-primary to-primary/90 shadow-md">
                            <Check className="h-4 w-4 ml-1" />
                            توقيع العقد
                          </Button>
                        )}
                        {contract?.provider_signed_at && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
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
