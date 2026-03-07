import { useState } from "react";
import { useBidComments, useAddBidComment } from "@/hooks/useBidComments";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, User, MessageCircle } from "lucide-react";

interface BidCommentThreadProps {
  bidId: string;
  bidStatus: string;
}

export function BidCommentThread({ bidId, bidStatus }: BidCommentThreadProps) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useBidComments(bidId);
  const addComment = useAddBidComment();
  const [content, setContent] = useState("");
  const isPending = bidStatus === "pending";

  const handleSend = () => {
    if (!content.trim()) return;
    addComment.mutate({ bidId, content: content.trim() }, {
      onSuccess: () => setContent(""),
    });
  };

  if (isLoading) return <Skeleton className="h-16 w-full" />;

  return (
    <div className="space-y-3">
      {comments && comments.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((c) => {
            const isMe = c.author_id === user?.id;
            return (
              <div key={c.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={(c as any).profiles?.avatar_url ?? undefined} />
                  <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                </Avatar>
                <div className={`rounded-lg px-3 py-1.5 text-sm max-w-[80%] ${isMe ? "bg-primary/10 text-foreground" : "bg-muted text-foreground"}`}>
                  <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">
                    {(c as any).profiles?.full_name}
                  </p>
                  <p className="whitespace-pre-wrap">{c.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5" dir="ltr">
                    {new Date(c.created_at).toLocaleString("ar-SA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">لا توجد تعليقات بعد</p>
      )}

      {isPending && (
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب تعليقك..."
            className="min-h-[40px] text-sm resize-none"
            rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button size="icon" className="shrink-0 h-10 w-10" onClick={handleSend} disabled={!content.trim() || addComment.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
