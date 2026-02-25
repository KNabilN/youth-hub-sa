import { useState, useRef, useEffect } from "react";
import { useMessages, useSendMessage, useMarkMessagesRead, type Message } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Paperclip, FileText, Image as ImageIcon, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatThreadProps {
  projectId: string;
  projectTitle: string;
}

export function ChatThread({ projectId, projectTitle }: ChatThreadProps) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(projectId);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mark messages as read when viewing
  useEffect(() => {
    if (projectId && messages?.some((m) => m.sender_id !== user?.id && !m.is_read)) {
      markRead.mutate(projectId);
    }
  }, [projectId, messages, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content && !attachment) return;

    sendMessage.mutate(
      {
        projectId,
        content: content || (attachment ? `📎 ${attachment.name}` : ""),
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
      },
      {
        onSuccess: () => {
          setText("");
          setAttachment(null);
        },
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
      const path = `messages/${projectId}/${Date.now()}_${file.name}`;
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
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <h2 className="font-bold text-lg">{projectTitle}</h2>
        <p className="text-xs text-muted-foreground">محادثة المشروع</p>
      </div>

      {/* Messages */}
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
              <Send className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">لا توجد رسائل بعد</p>
            <p className="text-xs text-muted-foreground mt-1">ابدأ المحادثة الآن</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} isImage={isImage} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Attachment Preview */}
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

      {/* Input */}
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
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sendMessage.isPending || (!text.trim() && !attachment)}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  isImage,
}: {
  message: Message;
  isOwn: boolean;
  isImage: (name: string) => boolean;
}) {
  return (
    <div className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarImage src={message.sender?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">
          {message.sender?.full_name?.[0] ?? "؟"}
        </AvatarFallback>
      </Avatar>
      <div className={cn("max-w-[70%] space-y-1")}>
        <p className={cn("text-[11px] font-medium", isOwn ? "text-left" : "text-right")}>
          {message.sender?.full_name}
        </p>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isOwn
              ? "bg-primary text-primary-foreground rounded-tl-sm"
              : "bg-muted rounded-tr-sm"
          )}
        >
          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
          {message.attachment_url && message.attachment_name && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block"
            >
              {isImage(message.attachment_name) ? (
                <img
                  src={message.attachment_url}
                  alt={message.attachment_name}
                  className="rounded-lg max-h-48 max-w-full object-cover"
                />
              ) : (
                <div className={cn(
                  "flex items-center gap-2 text-xs p-2 rounded-lg",
                  isOwn ? "bg-primary-foreground/10" : "bg-background"
                )}>
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{message.attachment_name}</span>
                </div>
              )}
            </a>
          )}
        </div>
        <p className={cn("text-[10px] text-muted-foreground", isOwn ? "text-left" : "text-right")}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: ar })}
        </p>
      </div>
    </div>
  );
}
