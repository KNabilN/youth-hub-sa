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
import { Textarea } from "@/components/ui/textarea";
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
 <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-4 animate-in fade-in zoom-in-95 duration-500">
 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent mx-auto mb-5 flex items-center justify-center ring-1 ring-primary/10">
 <MessageSquare className="h-9 w-9 text-primary" />
 </div>
 <h3 className="text-lg font-bold text-foreground mb-1.5">ابدأ المحادثة</h3>
 <p className="text-sm text-muted-foreground max-w-xs">
 اكتب رسالتك في الأسفل لإرسال أول رسالة في هذه المحادثة
 </p>
 <div className="mt-6 flex flex-col items-center gap-1.5 text-primary">
 <ArrowDown className="h-5 w-5 animate-bounce" />
 <span className="text-[11px] font-medium opacity-70">صندوق الكتابة</span>
 </div>
 </div>
 ) : (
 <div className="space-y-2">
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

 <div className="p-4 border-t-2 border-primary/10 bg-muted/40 shadow-[0_-4px_12px_-6px_hsl(var(--primary)/0.08)]">
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
 className="shrink-0 h-11 w-11 rounded-full hover:bg-background"
 onClick={() => fileInputRef.current?.click()}
 disabled={uploading}
 title="إرفاق ملف"
 >
 <Paperclip className={cn("h-5 w-5", uploading && "animate-spin")} />
 </Button>
 <Textarea
 value={text}
 onChange={(e) => setText(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault();
 handleSend();
 }
 }}
 placeholder="اكتب رسالتك هنا... (Shift+Enter لسطر جديد)"
 className="flex-1 min-h-[44px] max-h-32 resize-none rounded-2xl bg-background border-2 px-5 py-2.5 text-base focus-visible:ring-primary/40 focus-visible:border-primary/40 placeholder:text-muted-foreground/70"
 rows={1}
 disabled={send.isPending}
 />
 <Button
 type="submit"
 size="icon"
 disabled={send.isPending || (!text.trim() && !attachment)}
 className="shrink-0 h-11 w-11 rounded-full shadow-md hover:shadow-lg transition-shadow disabled:shadow-none"
 title="إرسال"
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
 <div className="max-w-[75%] space-y-1">
 <p className={cn("text-[11px] font-medium text-muted-foreground", isOwn ? "text-end" : "text-start")}>
 {isOwn ? "أنت" : otherPartyName ?? "الإدارة"}
 </p>
 <div
 className={cn(
 "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
 isOwn
 ? "bg-primary text-primary-foreground rounded-ss-sm"
 : "bg-muted rounded-se-sm"
 )}
 >
 {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
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
 <p
 className={cn(
 "text-[10px] mt-1.5 opacity-70",
 isOwn ? "text-end text-primary-foreground" : "text-start text-muted-foreground"
 )}
 >
 {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ar })}
 </p>
 </div>
 </div>
 </div>
 );
}
