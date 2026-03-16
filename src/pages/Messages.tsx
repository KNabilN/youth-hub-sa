import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatThread } from "@/components/messages/ChatThread";
import { useConversations } from "@/hooks/useMessages";
import { useInquiryConversations, type InquiryConversation } from "@/hooks/useServiceInquiry";
import { ServiceInquiryChat } from "@/components/services/ServiceInquiryChat";
import { MessageSquare, ArrowRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type ActiveTab = "projects" | "inquiries";
type SelectedItem = { type: "project"; id: string; title: string } | { type: "inquiry"; id: string; title: string };

export default function Messages() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("projects");
  const [selected, setSelected] = useState<SelectedItem>();
  const { data: conversations } = useConversations();
  const { data: inquiryConversations, isLoading: inquiriesLoading } = useInquiryConversations();

  const selectedConv = selected?.type === "project"
    ? conversations?.find((c) => c.project_id === selected.id)
    : null;

  const totalInquiryUnread = inquiryConversations?.reduce((sum, c) => sum + c.unread_count, 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الرسائل</h1>
            <p className="text-sm text-muted-foreground">تواصل مع أطراف الطلبات</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <div className="border rounded-2xl overflow-hidden bg-card" style={{ height: "calc(100vh - 250px)" }}>
          <div className="grid grid-cols-1 md:grid-cols-[min(320px,40vw)_1fr] h-full">
            {/* Conversation List */}
            <div className={cn(
              "border-s overflow-y-auto",
              selected && "hidden md:block"
            )}>
              <div className="p-3 border-b space-y-2">
                <h2 className="text-sm font-bold text-muted-foreground">المحادثات</h2>
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ActiveTab); setSelected(undefined); }}>
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="projects">الطلبات</TabsTrigger>
                    <TabsTrigger value="inquiries" className="gap-1.5">
                      استفسارات
                      {totalInquiryUnread > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">{totalInquiryUnread}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {activeTab === "projects" ? (
                <ConversationList
                  selectedProjectId={selected?.type === "project" ? selected.id : undefined}
                  onSelect={(id) => {
                    const conv = conversations?.find(c => c.project_id === id);
                    setSelected({ type: "project", id, title: conv?.project_title ?? "" });
                  }}
                />
              ) : (
                <InquiryConversationList
                  conversations={inquiryConversations ?? []}
                  isLoading={inquiriesLoading}
                  selectedInquiryId={selected?.type === "inquiry" ? selected.id : undefined}
                  onSelect={(inq) => setSelected({ type: "inquiry", id: inq.inquiry_id, title: inq.service_title })}
                />
              )}
            </div>

            {/* Chat Area */}
            <div className={cn(
              "flex flex-col",
              !selected && "hidden md:flex"
            )}>
              {selected ? (
                <div className="flex flex-col h-full">
                  {/* Mobile back button */}
                  <div className="md:hidden p-2 border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(undefined)}
                      className="gap-1"
                    >
                      <ArrowRight className="h-4 w-4" />
                      العودة للمحادثات
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0">
                    {selected.type === "project" && selectedConv ? (
                      <ChatThread
                        projectId={selected.id}
                        projectTitle={selectedConv.project_title}
                      />
                    ) : selected.type === "inquiry" ? (
                      <div className="flex flex-col h-full">
                        <div className="p-4 border-b bg-card">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                            <h2 className="font-bold text-lg">{selected.title}</h2>
                          </div>
                          <p className="text-xs text-muted-foreground">استفسار عن خدمة</p>
                        </div>
                        <div className="flex-1 min-h-0">
                          <ServiceInquiryChat inquiryId={selected.id} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">اختر محادثة</p>
                    <p className="text-sm text-muted-foreground mt-1">اختر مشروعاً أو استفساراً من القائمة</p>
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

/** Inquiry conversation list sub-component */
function InquiryConversationList({
  conversations,
  isLoading,
  selectedInquiryId,
  onSelect,
}: {
  conversations: InquiryConversation[];
  isLoading: boolean;
  selectedInquiryId?: string;
  onSelect: (conv: InquiryConversation) => void;
}) {
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

  if (!conversations.length) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">لا توجد استفسارات</p>
        <p className="text-xs text-muted-foreground mt-1">ستظهر هنا عند الاستفسار عن خدمة</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conv) => (
        <button
          key={conv.inquiry_id}
          onClick={() => onSelect(conv)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl text-start transition-all duration-200",
            selectedInquiryId === conv.inquiry_id
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
              <div className="absolute -top-1 [inset-inline-end:-0.25rem] h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
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
            <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
              <ShoppingBag className="h-3 w-3 shrink-0" />
              {conv.service_title}
            </p>
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
