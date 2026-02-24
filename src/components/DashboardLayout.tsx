import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-4 md:px-6 gap-3 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            
            <div className="flex-1" />

            {/* Notification bell */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <NotificationBadge />
            </Button>

            {/* User info */}
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/profile")}
            >
              <div className="text-end hidden sm:block">
                <p className="text-sm font-medium leading-none">{profile?.full_name || user?.email}</p>
                {profile?.full_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                )}
              </div>
              <Avatar className="h-9 w-9 border-2 border-border">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {(profile?.full_name?.[0] || user?.email?.[0] || "؟").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto bg-pattern">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
