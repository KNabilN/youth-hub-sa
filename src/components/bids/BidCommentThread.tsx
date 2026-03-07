import { useState, useRef, useEffect } from "react";
import { useBidComments, useAddBidComment } from "@/hooks/useBidComments";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface BidCommentThreadProps {
  bidId: string;
  bidStatus: string;
}

export function BidCommentThread({ bidId, bidStatus }: BidCommentThreadProps) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useBidComments(bidId);
  const addComment = useAddBidComment();
  const [content, setContent] = useState("");
  const canComment = bidStatus === "pending";
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSend = () => {
    if (!content.trim()) return;
    addComment.mutate(
      { bidId, content: content.trim() },
      { onSuccess: () => setContent("") }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-1/2 ms-auto" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ScrollArea className="h-[320px] rounded-xl border border-border/50 bg-muted/30 p-4">
        {comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((c) => {
              const isMe = c.author_id === user?.id;
              const profile = c as any;
              const name =
                profile.profiles?.organization_name ||
                profile.profiles?.full_name ||
                "مستخدم";
              const avatar = profile.profiles?.avatar_url;

              return (
                <div
                  key={c.id}
                  className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5 ring-2 ring-background">
                    <AvatarImage src={avatar ?? undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      <User className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="max-w-[78%] space-y-1">
                    <p
                      className={`text-[11px] font-semibold text-muted-foreground/80 px-1 ${
                        isMe ? "text-left" : "text-right"
                      }`}
                    >
                      {name}
                    </p>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-se-md"
                          : "bg-background text-foreground border border-border/60 rounded-ss-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{c.content}</p>
                    </div>
                    <p
                      className={`text-[10px] text-muted-foreground/60 px-1 ${
                        isMe ? "text-left" : "text-right"
                      }`}
                      dir="ltr"
                    >
                      {formatDistanceToNow(new Date(c.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-12">
            <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center">
              <MessageCircle className="h-7 w-7 opacity-40" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">لا توجد رسائل بعد</p>
              <p className="text-xs text-muted-foreground/60">
                {canComment ? "ابدأ المحادثة مع الطرف الآخر" : "انتهت فترة المحادثة"}
              </p>
            </div>
          </div>
        )}
      </ScrollArea>

      {canComment && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 items-end"
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 text-sm min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0 h-11 w-11 rounded-xl"
            disabled={!content.trim() || addComment.isPending}
          >
            {addComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}

      {!canComment && comments && comments.length > 0 && (
        <p className="text-xs text-muted-foreground/60 text-center py-1">
          تم إغلاق المحادثة — العرض لم يعد قيد المراجعة
        </p>
      )}
    </div>
  );
}
