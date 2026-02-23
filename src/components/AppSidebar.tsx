import {
  LayoutDashboard,
  FolderKanban,
  Store,
  FileText,
  Users,
  Settings,
  LogOut,
  Bell,
  HandCoins,
  BarChart3,
  ClipboardList,
  Shield,
  Gavel,
  Receipt,
  Layers,
  MessageSquare,
  UserCog,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

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
    { title: "الإعدادات", url: "/admin/settings", icon: Settings },
  ],
};

export function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const items = role ? menuByRole[role] : [];

  const roleLabel: Record<string, string> = {
    super_admin: "مدير النظام",
    youth_association: "جمعية شبابية",
    service_provider: "مقدم خدمة",
    donor: "مانح",
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm text-sidebar-foreground truncate">الخدمات المشتركة</h2>
            <p className="text-xs text-sidebar-foreground/60">{role ? roleLabel[role] : ""}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="ml-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">عام</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/notifications" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <Bell className="ml-2 h-4 w-4" />
                    <span>الإشعارات</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/tickets" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <MessageSquare className="ml-2 h-4 w-4" />
                    <span>الدعم الفني</span>
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
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="ml-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
