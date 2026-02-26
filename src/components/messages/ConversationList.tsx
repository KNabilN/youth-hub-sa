import { useConversations, type Conversation } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  selectedProjectId?: string;
  onSelect: (projectId: string) => void;
}

export function ConversationList({ selectedProjectId, onSelect }: ConversationListProps) {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations?.length) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">لا توجد محادثات</p>
        <p className="text-xs text-muted-foreground mt-1">ستظهر المحادثات هنا عند بدء العمل على طلب</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conv) => (
        <button
          key={conv.project_id}
          onClick={() => onSelect(conv.project_id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200",
            selectedProjectId === conv.project_id
              ? "bg-primary/10 border border-primary/20"
              : "hover:bg-muted/50"
          )}
        >
          <div className="relative shrink-0">
            <Avatar className="h-11 w-11">
              <AvatarImage src={conv.other_party_avatar || undefined} />
              <AvatarFallback className="text-sm">{conv.other_party_name[0]}</AvatarFallback>
            </Avatar>
            {conv.unread_count > 0 && (
              <div className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {conv.unread_count}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate">{conv.other_party_name}</p>
              {conv.last_message_at && conv.last_message && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: ar })}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.project_title}</p>
            {conv.last_message && (
              <p className={cn(
                "text-xs truncate mt-0.5",
                conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {conv.last_message}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
