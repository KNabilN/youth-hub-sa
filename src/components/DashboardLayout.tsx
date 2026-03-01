import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Menu, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { data: notifications } = useNotifications(0, 9);
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const isAdmin = role === "super_admin";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <a href="#main-content" className="skip-link">
          تخطي إلى المحتوى الرئيسي
        </a>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border flex items-center px-4 md:px-6 gap-3 bg-card/80 backdrop-blur-sm sticky top-0 z-30" role="banner">
            <SidebarTrigger>
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">فتح القائمة الجانبية</span>
            </SidebarTrigger>
            
            <div className="flex-1" />

            {/* Notification bell */}
            {isAdmin ? (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate("/admin/notifications")}
                aria-label="الإشعارات"
              >
                <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <NotificationBadge />
              </Button>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="الإشعارات"
                  >
                    <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <NotificationBadge />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
                  <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="text-sm font-semibold">الإشعارات</h3>
                    {(unreadCount ?? 0) > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => markAllAsRead.mutate()}
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        قراءة الكل
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="max-h-80">
                    {!notifications?.length ? (
                      <p className="text-sm text-muted-foreground text-center py-8">لا توجد إشعارات</p>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            className={`w-full text-start p-3 text-sm hover:bg-muted/50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
                            onClick={() => {
                              if (!n.is_read) markAsRead.mutate(n.id);
                            }}
                          >
                            <p className={`leading-relaxed ${!n.is_read ? "font-medium" : "text-muted-foreground"}`}>
                              {n.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(n.created_at).toLocaleDateString("ar-SA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}

            {/* User info */}
            <button
              className="flex items-center gap-3 hover:opacity-80 transition-opacity rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => navigate("/profile")}
              aria-label="الملف الشخصي"
            >
              <div className="text-end hidden sm:block">
                <p className="text-sm font-medium leading-none">{profile?.full_name || user?.email}</p>
                {profile?.full_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                )}
              </div>
              <Avatar className="h-9 w-9 border-2 border-border">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "صورة المستخدم"} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {(profile?.full_name?.[0] || user?.email?.[0] || "؟").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </header>
          <main id="main-content" className="flex-1 p-4 md:p-6 overflow-auto bg-pattern animate-fade-in" role="main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
