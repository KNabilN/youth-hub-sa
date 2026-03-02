import { useState } from "react";
import { useTicketReplies, useCreateTicketReply } from "@/hooks/useTicketReplies";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { MessageCircle, Send, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { FileUploader } from "@/components/attachments/FileUploader";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TicketReplyThreadProps {
  ticketId: string;
  ticketStatus: string;
}

export function TicketReplyThread({ ticketId, ticketStatus }: TicketReplyThreadProps) {
  const { data: replies, isLoading } = useTicketReplies(ticketId);
  const createReply = useCreateTicketReply();
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  const canRespond = ticketStatus === "open" || ticketStatus === "in_progress";

  const handleSubmit = () => {
    if (!message.trim()) return;
    createReply.mutate(
      { ticketId, message },
      {
        onSuccess: () => {
          setMessage("");
          toast.success("تم إرسال الرد");
        },
        onError: () => toast.error("حدث خطأ"),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          سجل المحادثات ({replies?.length ?? 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">جارٍ التحميل...</p>
        ) : replies?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد ردود بعد</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {replies?.map((r: any) => (
              <div
                key={r.id}
                className={`flex gap-3 ${r.author_id === user?.id ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {r.profiles?.full_name?.charAt(0) ?? "؟"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg p-3 max-w-[75%] text-sm ${
                    r.author_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="font-medium text-xs mb-1 opacity-80">
                    {r.profiles?.full_name ?? "مستخدم"}
                  </p>
                  <p className="whitespace-pre-wrap">{r.message}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {format(new Date(r.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attachments */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1.5">
              <Paperclip className="h-3.5 w-3.5" />
              المرفقات
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3">
            <AttachmentList entityType="ticket" entityId={ticketId} />
            {canRespond && <FileUploader entityType="ticket" entityId={ticketId} />}
          </CollapsibleContent>
        </Collapsible>

        {/* Reply Input */}
        {canRespond && (
          <div className="flex gap-2 border-t pt-3">
            <Textarea
              placeholder="اكتب ردك..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={createReply.isPending || !message.trim()}
              className="shrink-0 self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
