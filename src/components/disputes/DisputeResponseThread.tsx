import { useState } from "react";
import { useDisputeResponses, useCreateDisputeResponse } from "@/hooks/useDisputeResponses";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { MessageCircle, Send, Paperclip } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DisputeTimeline } from "@/components/disputes/DisputeTimeline";
import { FileUploader } from "@/components/attachments/FileUploader";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DisputeResponseThreadProps {
  disputeId: string;
  disputeStatus: string;
}

export function DisputeResponseThread({ disputeId, disputeStatus }: DisputeResponseThreadProps) {
  const { data: responses, isLoading } = useDisputeResponses(disputeId);
  const createResponse = useCreateDisputeResponse();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showUploader, setShowUploader] = useState(false);

  const canRespond = disputeStatus === "open" || disputeStatus === "under_review";

  const handleSubmit = () => {
    if (!message.trim()) return;
    createResponse.mutate(
      { disputeId, message },
      {
        onSuccess: () => {
          setMessage("");
          toast({ title: "تم إرسال الرد" });
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          سجل المحادثات ({responses?.length ?? 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Timeline */}
        <DisputeTimeline disputeId={disputeId} />

        {/* Responses */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">جارٍ التحميل...</p>
        ) : responses?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد ردود بعد</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {responses?.map((r: any) => (
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
                  <p>{r.message}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {format(new Date(r.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Evidence Attachments */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1.5">
              <Paperclip className="h-3.5 w-3.5" />
              الأدلة والمرفقات
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-3">
            <AttachmentList entityType="dispute" entityId={disputeId} />
            {canRespond && <FileUploader entityType="dispute" entityId={disputeId} />}
          </CollapsibleContent>
        </Collapsible>

        {/* Response Input */}
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
              disabled={createResponse.isPending || !message.trim()}
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
