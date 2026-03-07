import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User, Paperclip, ExternalLink, MessageCircle } from "lucide-react";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { BidCommentThread } from "@/components/bids/BidCommentThread";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BidCardProps {
  bid: {
    id: string;
    price: number;
    timeline_days: number;
    cover_letter: string;
    status: string;
    created_at: string;
    provider_id: string;
    profiles: { full_name: string; avatar_url: string | null } | null;
  };
  onAccept?: (bid: any) => void;
  onReject?: (bidId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
}
const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "قيد المراجعة", className: "bg-warning/15 text-warning border-warning/30" },
  accepted: { label: "مقبول", className: "bg-success/15 text-success border-success/30" },
  rejected: { label: "مرفوض", className: "bg-destructive/15 text-destructive border-destructive/30" },
  withdrawn: { label: "مسحوب", className: "bg-muted text-muted-foreground" },
};

export function BidCard({ bid, onAccept, onReject, isLoading, showActions = true }: BidCardProps) {
  const status = statusMap[bid.status] ?? statusMap.pending;
  const [showAttachments, setShowAttachments] = useState(false);
  const [showComments, setShowComments] = useState(false);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <Link
            to={`/profile/${bid.provider_id}`}
            className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={bid.profiles?.avatar_url ?? undefined} />
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">{(bid.profiles as any)?.organization_name || bid.profiles?.full_name || "مقدم خدمة"}</p>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground">{new Date(bid.created_at).toLocaleDateString("ar-SA")}</p>
            </div>
          </Link>
          <Badge variant="outline" className={status.className}>{status.label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{bid.cover_letter}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">{bid.price} ر.س</span>
          <span className="text-muted-foreground">{bid.timeline_days} يوم</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          onClick={() => setShowAttachments(!showAttachments)}
        >
          <Paperclip className="h-3.5 w-3.5" />
          المرفقات
        </Button>

        {showAttachments && (
          <AttachmentList entityType="bid" entityId={bid.id} />
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          المحادثة
        </Button>

        {showComments && (
          <BidCommentThread bidId={bid.id} bidStatus={bid.status} />
        )}

        {showActions && bid.status === "pending" && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => onAccept?.(bid)} disabled={isLoading}>
              <Check className="h-3.5 w-3.5 me-1" />
              قبول
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReject?.(bid.id)} disabled={isLoading}>
              <X className="h-3.5 w-3.5 me-1" />
              رفض
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}