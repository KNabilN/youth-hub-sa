import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminConversations, type AdminConversation } from "@/hooks/useAdminMessages";
import { AdminUserChatThread } from "@/components/admin/AdminUserChatThread";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, Shield } from "lucide-react";
import { cn, getDisplayName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function AdminMessages() {
  const { data: conversations, isLoading } = useAdminConversations();
  const [selected, setSelected] = useState<AdminConversation | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">رسائل المستخدمين</h1>
            <p className="text-sm text-muted-foreground">المحادثات المباشرة بين الإدارة والمستخدمين</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <div className="border rounded-2xl overflow-hidden bg-card shadow-sm" style={{ height: "min(calc(100vh - 220px), 720px)" }}>
          <div className="grid grid-cols-1 md:grid-cols-[min(340px,40vw)_1fr] h-full">
            {/* Conversation list */}
            <div className={cn("border-s overflow-y-auto", selected && "hidden md:block")}>
              <div className="p-3 border-b">
                <h2 className="text-sm font-bold text-muted-foreground">المحادثات</h2>
              </div>

              {isLoading ? (
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
              ) : !conversations?.length ? (
                <div className="text-center py-16 px-4">
                  <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">لا توجد محادثات</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ابدأ محادثة من صفحة "إدارة المستخدمين"
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => {
                    const name = conv.user ? getDisplayName(conv.user as any) : "مستخدم محذوف";
                    return (
                      <button
                        key={conv.user_id}
                        onClick={() => setSelected(conv)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-start transition-all duration-200",
                          selected?.user_id === conv.user_id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={conv.user?.avatar_url || undefined} />
                            <AvatarFallback className="text-sm">{name[0] ?? "؟"}</AvatarFallback>
                          </Avatar>
                          {conv.unread_count > 0 && (
                            <div className="absolute -top-1 [inset-inline-end:-0.25rem] h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                              {conv.unread_count}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold truncate">{name}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatDistanceToNow(new Date(conv.last_message_at), {
                                addSuffix: false,
                                locale: ar,
                              })}
                            </span>
                          </div>
                          {conv.user?.user_number && (
                            <p className="text-[10px] text-muted-foreground font-mono truncate">
                              {conv.user.user_number}
                            </p>
                          )}
                          <p
                            className={cn(
                              "text-xs truncate mt-0.5",
                              conv.unread_count > 0
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {conv.last_message || "—"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat area */}
            <div className={cn("flex flex-col", !selected && "hidden md:flex")}>
              {selected ? (
                <div className="flex flex-col h-full">
                  <div className="md:hidden p-2 border-b">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1">
                      <ArrowRight className="h-4 w-4" />
                      العودة للمحادثات
                    </Button>
                  </div>
                  <div className="p-4 border-b-2 border-primary/10 bg-gradient-to-l from-primary/5 via-primary/[0.02] to-transparent">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                        <AvatarImage src={selected.user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(selected.user ? getDisplayName(selected.user as any) : "؟")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold truncate">
                          {selected.user ? getDisplayName(selected.user as any) : "مستخدم"}
                        </h2>
                        {selected.user?.user_number && (
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {selected.user.user_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <AdminUserChatThread
                      userId={selected.user_id}
                      otherPartyName={
                        selected.user ? getDisplayName(selected.user as any) : undefined
                      }
                      otherPartyAvatar={selected.user?.avatar_url}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">اختر محادثة</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      اختر مستخدماً من القائمة لعرض المحادثة
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
