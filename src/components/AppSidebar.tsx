import {
  LayoutDashboard, FolderKanban, ScrollText, Store, FileText, Users, Settings,
  LogOut, Bell, HandCoins, BarChart3, ClipboardList, Shield, Gavel, Receipt,
  Layers, MessageSquare, UserCog, UserCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const menuByRole = {
  youth_association: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "المشاريع", url: "/projects", icon: FolderKanban },
    { title: "سوق الخدمات", url: "/marketplace", icon: Store },
    { title: "العقود", url: "/contracts", icon: FileText },
    { title: "سجل الساعات", url: "/time-logs", icon: ClipboardList },
    { title: "التقييمات", url: "/ratings", icon: BarChart3 },
  ],
  service_provider: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "خدماتي", url: "/my-services", icon: Layers },
    { title: "المشاريع المتاحة", url: "/available-projects", icon: FolderKanban },
    { title: "عروضي", url: "/my-bids", icon: FileText },
    { title: "تسجيل الساعات", url: "/time-tracking", icon: ClipboardList },
    { title: "الأرباح", url: "/earnings", icon: Receipt },
  ],
  donor: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "سوق الخدمات", url: "/marketplace", icon: Store },
    { title: "الجمعيات", url: "/associations", icon: Users },
    { title: "التبرعات", url: "/donations", icon: HandCoins },
    { title: "تقارير الأثر", url: "/impact", icon: BarChart3 },
  ],
  super_admin: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "إدارة المستخدمين", url: "/admin/users", icon: UserCog },
    { title: "المشاريع", url: "/admin/projects", icon: FolderKanban },
    { title: "الخدمات", url: "/admin/services", icon: Store },
    { title: "النزاعات", url: "/admin/disputes", icon: Gavel },
    { title: "المالية", url: "/admin/finance", icon: Receipt },
    { title: "التقارير", url: "/admin/reports", icon: BarChart3 },
    { title: "سجل التدقيق", url: "/admin/audit-log", icon: ScrollText },
    { title: "الإعدادات", url: "/admin/settings", icon: Settings },
  ],
};

const roleLabel: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

export function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const items = role ? menuByRole[role] : [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-xl flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm text-sidebar-foreground truncate">الخدمات المشتركة</h2>
            <p className="text-xs text-sidebar-foreground/60">{role ? roleLabel[role] : ""}</p>
          </div>
        </div>

        {profile && (
          <>
            <Separator className="my-3 bg-sidebar-border" />
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-sidebar-border">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
                  {(profile.full_name?.[0] || "؟")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.full_name}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
              </div>
            </div>
          </>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-wider">القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/60 rounded-lg transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-r-4 border-sidebar-primary"
                    >
                      <item.icon className="ml-2 h-[18px] w-[18px]" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-wider">عام</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/notifications" className="hover:bg-sidebar-accent/60 rounded-lg transition-colors" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-r-4 border-sidebar-primary">
                    <Bell className="ml-2 h-[18px] w-[18px]" />
                    <span className="flex-1">الإشعارات</span>
                    <NotificationBadge />
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/tickets" className="hover:bg-sidebar-accent/60 rounded-lg transition-colors" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-r-4 border-sidebar-primary">
                    <MessageSquare className="ml-2 h-[18px] w-[18px]" />
                    <span>الدعم الفني</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/profile" className="hover:bg-sidebar-accent/60 rounded-lg transition-colors" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-r-4 border-sidebar-primary">
                    <UserCircle className="ml-2 h-[18px] w-[18px]" />
                    <span>الملف الشخصي</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg"
          onClick={signOut}
        >
          <LogOut className="ml-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
