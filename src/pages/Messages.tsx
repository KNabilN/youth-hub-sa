import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatThread } from "@/components/messages/ChatThread";
import { useConversations } from "@/hooks/useMessages";
import { MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Messages() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const { data: conversations } = useConversations();

  const selectedConv = conversations?.find((c) => c.project_id === selectedProjectId);

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
              selectedProjectId && "hidden md:block"
            )}>
              <div className="p-3 border-b">
                <h2 className="text-sm font-bold text-muted-foreground">المحادثات</h2>
              </div>
              <ConversationList
                selectedProjectId={selectedProjectId}
                onSelect={setSelectedProjectId}
              />
            </div>

            {/* Chat Area */}
            <div className={cn(
              "flex flex-col",
              !selectedProjectId && "hidden md:flex"
            )}>
              {selectedProjectId && selectedConv ? (
                <div className="flex flex-col h-full">
                  {/* Mobile back button */}
                  <div className="md:hidden p-2 border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProjectId(undefined)}
                      className="gap-1"
                    >
                      <ArrowRight className="h-4 w-4" />
                      العودة للمحادثات
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ChatThread
                      projectId={selectedProjectId}
                      projectTitle={selectedConv.project_title}
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
                    <p className="text-sm text-muted-foreground mt-1">اختر مشروعاً من القائمة لبدء المحادثة</p>
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
