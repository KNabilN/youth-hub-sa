import { useBids, useAcceptBid, useRejectBid } from "@/hooks/useBids";
import { BidCard } from "./BidCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface BidListProps {
  projectId: string;
  role?: string | null;
  userId?: string;
}

export function BidList({ projectId, role, userId }: BidListProps) {
  const { data: bids, isLoading } = useBids(projectId);
  const acceptBid = useAcceptBid();
  const rejectBid = useRejectBid();

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-40" />)}</div>;

  // Filter bids: providers only see their own bid(s)
  const filteredBids = role === "service_provider" && userId
    ? bids?.filter(bid => bid.provider_id === userId)
    : bids;

  if (!filteredBids?.length) return <p className="text-sm text-muted-foreground text-center py-8">لا توجد عروض حتى الآن</p>;

  const showActions = role === "youth_association";

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
      {filteredBids.map(bid => (
        <BidCard
          key={bid.id}
          bid={bid as any}
          onAccept={showActions ? handleAccept : undefined}
          onReject={showActions ? handleReject : undefined}
          isLoading={acceptBid.isPending || rejectBid.isPending}
          showActions={showActions}
        />
      ))}
    </div>
  );
}