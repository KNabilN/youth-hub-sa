import { usePendingEditRequestsCount } from "@/hooks/useEditRequests";
import {
  LayoutDashboard, FolderKanban, ScrollText, Store, FileText, Users, Settings,
  LogOut, Bell, HandCoins, BarChart3, ClipboardList, Shield, Gavel, Receipt, FileEdit,
  Layers, MessageSquare, UserCog, UserCircle, ChevronLeft, Moon, Sun, ShoppingCart, LayoutTemplate,
  Mail,
} from "lucide-react";
import { useTheme } from "next-themes";
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

const menuByRole = {
  youth_association: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "طلبات الجمعيات", url: "/projects", icon: FolderKanban },
    { title: "الرسائل", url: "/messages", icon: Mail },
    { title: "سوق الخدمات", url: "/marketplace", icon: Store },
    { title: "سلة المشتريات", url: "/cart", icon: ShoppingCart },
    { title: "العقود", url: "/contracts", icon: FileText },
    { title: "سجل الساعات", url: "/time-logs", icon: ClipboardList },
    { title: "التقييمات", url: "/ratings", icon: BarChart3 },
  ],
  service_provider: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "خدماتي", url: "/my-services", icon: Layers },
    { title: "طلبات الجمعيات المتاحة", url: "/available-projects", icon: FolderKanban },
    { title: "طلباتي", url: "/my-projects", icon: FolderKanban },
    { title: "الرسائل", url: "/messages", icon: Mail },
    { title: "عروضي", url: "/my-bids", icon: FileText },
    { title: "العقود", url: "/contracts", icon: ScrollText },
    { title: "تسجيل الساعات", url: "/time-tracking", icon: ClipboardList },
    { title: "الأرباح", url: "/earnings", icon: Receipt },
    { title: "الفواتير", url: "/invoices", icon: Receipt },
    { title: "التقييمات", url: "/ratings", icon: BarChart3 },
    { title: "الشكاوى", url: "/my-disputes", icon: Gavel },
    { title: "سوق الخدمات", url: "/marketplace", icon: Store },
  ],
  donor: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "سوق الخدمات", url: "/marketplace", icon: Store },
    { title: "سلة المشتريات", url: "/cart", icon: ShoppingCart },
    { title: "الجمعيات", url: "/associations", icon: Users },
    { title: "المنح", url: "/donations", icon: HandCoins },
    { title: "تقارير الأثر", url: "/impact", icon: BarChart3 },
  ],
  super_admin: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "إدارة المستخدمين", url: "/admin/users", icon: UserCog },
    { title: "طلبات الجمعيات", url: "/admin/projects", icon: FolderKanban },
    { title: "الخدمات", url: "/admin/services", icon: Store },
    { title: "الشكاوى", url: "/admin/disputes", icon: Gavel },
    { title: "المالية", url: "/admin/finance", icon: Receipt },
    { title: "التقارير", url: "/admin/reports", icon: BarChart3 },
    { title: "الإشعارات", url: "/admin/notifications", icon: Bell },
    { title: "تذاكر الدعم", url: "/admin/tickets", icon: MessageSquare },
    { title: "سجل التدقيق", url: "/admin/audit-log", icon: ScrollText },
    { title: "إدارة المحتوى", url: "/admin/cms", icon: LayoutTemplate },
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
  const { theme, setTheme } = useTheme();
  const { data: pendingEditCount } = usePendingEditRequestsCount();
  const items = role ? menuByRole[role] : [];
  const showEditRequests = role && role !== "super_admin";

  return (
    <Sidebar side="right">
      {/* User Profile Header */}
      <SidebarHeader className="p-5 pb-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            <Avatar className="h-16 w-16 border-[3px] border-sidebar-ring shadow-lg">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-sidebar-accent text-sidebar-accent-foreground font-bold">
                {(profile?.full_name?.[0] || "؟")}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-sidebar-background" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-sidebar-foreground">{profile?.full_name || "مستخدم"}</p>
            <p className="text-[11px] text-sidebar-foreground/50 truncate max-w-[180px]">{user?.email}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-bold uppercase tracking-widest px-3 mb-1">
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 group"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border-s-[3px] border-sidebar-ring"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30 group-hover:bg-sidebar-accent/60 transition-colors">
                        <item.icon className="h-[17px] w-[17px]" />
                      </div>
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Separator */}
        <div className="mx-4 my-1">
          <div className="h-px bg-sidebar-border/60" />
        </div>

        {/* General */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-bold uppercase tracking-widest px-3 mb-1">
            عام
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/notifications"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 group"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border-s-[3px] border-sidebar-ring"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30 group-hover:bg-sidebar-accent/60 transition-colors">
                      <Bell className="h-[17px] w-[17px]" />
                    </div>
                    <span className="text-sm">الإشعارات</span>
                    <span className="ms-auto"><NotificationBadge /></span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {showEditRequests && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/edit-requests"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 group"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border-s-[3px] border-sidebar-ring"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30 group-hover:bg-sidebar-accent/60 transition-colors">
                        <FileEdit className="h-[17px] w-[17px]" />
                      </div>
                      <span className="text-sm">طلبات التعديل</span>
                      {(pendingEditCount ?? 0) > 0 && (
                        <span className="ms-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                          {pendingEditCount}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/tickets"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 group"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border-s-[3px] border-sidebar-ring"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30 group-hover:bg-sidebar-accent/60 transition-colors">
                      <MessageSquare className="h-[17px] w-[17px]" />
                    </div>
                    <span className="text-sm">الدعم الفني</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 group"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border-s-[3px] border-sidebar-ring"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30 group-hover:bg-sidebar-accent/60 transition-colors">
                      <UserCircle className="h-[17px] w-[17px]" />
                    </div>
                    <span className="text-sm">الملف الشخصي</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/60 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg py-2.5 transition-all duration-200"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30">
            {theme === "dark" ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
          </div>
          <span className="text-sm">{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-destructive/20 rounded-lg py-2.5 transition-all duration-200"
          onClick={signOut}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30">
            <LogOut className="h-[17px] w-[17px]" />
          </div>
          <span className="text-sm">تسجيل الخروج</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
