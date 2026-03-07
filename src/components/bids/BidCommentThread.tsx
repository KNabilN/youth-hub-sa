import { useState, useRef, useEffect } from "react";
import { useBidComments, useAddBidComment } from "@/hooks/useBidComments";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, MessageCircle } from "lucide-react";
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
  const isPending = bidStatus === "pending";
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

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;

  return (
    <div className="flex flex-col gap-3">
      <ScrollArea className="h-[280px] rounded-xl border bg-muted/20 p-3">
        {comments && comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((c) => {
              const isMe = c.author_id === user?.id;
              const profile = c as any;
              const name = profile.profiles?.organization_name || profile.profiles?.full_name || "مستخدم";
              const avatar = profile.profiles?.avatar_url;

              return (
                <div
                  key={c.id}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-7 w-7 shrink-0 mt-1">
                    <AvatarImage src={avatar ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="max-w-[75%] space-y-0.5">
                    <p
                      className={`text-[10px] font-medium text-muted-foreground px-1 ${
                        isMe ? "text-left" : "text-right"
                      }`}
                    >
                      {name}
                    </p>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-se-sm"
                          : "bg-muted text-foreground rounded-ss-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{c.content}</p>
                    </div>
                    <p
                      className={`text-[10px] text-muted-foreground px-1 ${
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
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-10">
            <MessageCircle className="h-8 w-8 opacity-40" />
            <p className="text-xs">لا توجد تعليقات بعد — ابدأ المحادثة</p>
          </div>
        )}
      </ScrollArea>

      {isPending && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب تعليقك..."
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0 h-10 w-10"
            disabled={!content.trim() || addComment.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
