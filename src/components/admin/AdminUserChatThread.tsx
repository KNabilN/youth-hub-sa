import { useState, useRef, useEffect } from "react";
import {
  useAdminMessageThread,
  useSendAdminMessage,
  useMarkAdminMessagesRead,
  type AdminDirectMessage,
} from "@/hooks/useAdminMessages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Paperclip, FileText, X, Shield, MessageSquare, ArrowDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  /** Conversation key = the non-admin user's id */
  userId: string;
  /** Show sender avatar/name (for admin view of multi-admin replies) */
  otherPartyName?: string;
  otherPartyAvatar?: string | null;
}

export function AdminUserChatThread({ userId, otherPartyName, otherPartyAvatar }: Props) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useAdminMessageThread(userId);
  const send = useSendAdminMessage();
  const markRead = useMarkAdminMessagesRead();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mark unread as read on open / new messages
  useEffect(() => {
    if (userId && messages?.some((m) => m.sender_id !== user?.id && !m.is_read)) {
      markRead.mutate(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const content = text.trim();
    if (!content && !attachment) return;
    send.mutate(
      {
        userId,
        content: content || (attachment ? `📎 ${attachment.name}` : ""),
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
      },
      {
        onSuccess: () => {
          setText("");
          setAttachment(null);
        },
        onError: () => toast.error("فشل إرسال الرسالة"),
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("الحد الأقصى لحجم الملف هو 10 ميجابايت");
      return;
    }
    setUploading(true);
    try {
      const path = `admin-messages/${userId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("attachments").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(path);
      setAttachment({ url: urlData.publicUrl, name: file.name });
    } catch {
      toast.error("فشل رفع الملف");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("flex gap-2", i % 2 === 0 && "flex-row-reverse")}>
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-16 w-48 rounded-xl" />
              </div>
            ))}
          </div>
        ) : !messages?.length ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">لا توجد رسائل بعد</p>
            <p className="text-xs text-muted-foreground mt-1">ابدأ المحادثة بكتابة أول رسالة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <Bubble
                key={m.id}
                msg={m}
                isOwn={m.sender_id === user?.id}
                isImage={isImage}
                otherPartyName={otherPartyName}
                otherPartyAvatar={otherPartyAvatar}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {attachment && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span className="truncate flex-1">{attachment.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachment(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-4 border-t bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className={cn("h-5 w-5", uploading && "animate-spin")} />
          </Button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1"
            disabled={send.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={send.isPending || (!text.trim() && !attachment)}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Bubble({
  msg,
  isOwn,
  isImage,
  otherPartyName,
  otherPartyAvatar,
}: {
  msg: AdminDirectMessage;
  isOwn: boolean;
  isImage: (name: string) => boolean;
  otherPartyName?: string;
  otherPartyAvatar?: string | null;
}) {
  return (
    <div className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        {!isOwn && otherPartyAvatar ? (
          <AvatarImage src={otherPartyAvatar} />
        ) : null}
        <AvatarFallback className="text-xs">
          {isOwn ? "أنا" : (otherPartyName?.[0] ?? <Shield className="h-3.5 w-3.5" />)}
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[70%] space-y-1">
        <p className={cn("text-[11px] font-medium", isOwn ? "text-end" : "text-start")}>
          {isOwn ? "أنت" : otherPartyName ?? "الإدارة"}
        </p>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isOwn
              ? "bg-primary text-primary-foreground rounded-ss-sm"
              : "bg-muted rounded-se-sm"
          )}
        >
          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
          {msg.attachment_url && msg.attachment_name && (
            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
              {isImage(msg.attachment_name) ? (
                <img
                  src={msg.attachment_url}
                  alt={msg.attachment_name}
                  className="rounded-lg max-h-48 max-w-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs p-2 rounded-lg",
                    isOwn ? "bg-primary-foreground/10" : "bg-background"
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{msg.attachment_name}</span>
                </div>
              )}
            </a>
          )}
        </div>
        <p className={cn("text-[10px] text-muted-foreground", isOwn ? "text-end" : "text-start")}>
          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ar })}
        </p>
      </div>
    </div>
  );
}
