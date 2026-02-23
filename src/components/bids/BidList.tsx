import { useBids, useAcceptBid, useRejectBid } from "@/hooks/useBids";
import { BidCard } from "./BidCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

export function BidList({ projectId }: { projectId: string }) {
  const { data: bids, isLoading } = useBids(projectId);
  const acceptBid = useAcceptBid();
  const rejectBid = useRejectBid();

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-40" />)}</div>;
  if (!bids?.length) return <p className="text-sm text-muted-foreground text-center py-8">لا توجد عروض حتى الآن</p>;

  const handleAccept = (bid: any) => {
    acceptBid.mutate(
      { bidId: bid.id, projectId, providerId: bid.provider_id, price: bid.price },
      {
        onSuccess: () => toast({ title: "تم قبول العرض بنجاح" }),
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const handleReject = (bidId: string) => {
    rejectBid.mutate(bidId, {
      onSuccess: () => toast({ title: "تم رفض العرض" }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-3">
      {bids.map(bid => (
        <BidCard
          key={bid.id}
          bid={bid as any}
          onAccept={handleAccept}
          onReject={handleReject}
          isLoading={acceptBid.isPending || rejectBid.isPending}
        />
      ))}
    </div>
  );
}
