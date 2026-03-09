import {
  LayoutDashboard, FolderKanban, ScrollText, Store, FileText, Users, Settings,
  LogOut, Bell, HandCoins, BarChart3, ClipboardList, Shield, Gavel, Receipt,
  Layers, MessageSquare, UserCog, UserCircle, ChevronLeft, Moon, Sun, ShoppingCart, LayoutTemplate,
  Mail, Trash2, ShoppingBag, Home, Inbox, Heart, Wallet, BookOpen,
} from "lucide-react";
import { useTheme } from "next-themes";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { useCartCount } from "@/hooks/useCart";
import { useAdminFinancePending } from "@/hooks/useAdminFinancePending";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";
import logoWhiteImg from "@/assets/logo-white.png";

const menuByRole = {
  youth_association: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "دليل الاستخدام", url: "/guide", icon: BookOpen },
    { title: "طلبات الجمعيات", url: "/projects", icon: FolderKanban },
    { title: "الرسائل", url: "/messages", icon: Mail },
    { title: "سوق الخدمات", url: "/marketplace", icon: Store },
    { title: "سلة المشتريات", url: "/cart", icon: ShoppingCart },
    { title: "المانحون", url: "/donors", icon: Users },
    { title: "طلبات المنح", url: "/my-grants", icon: HandCoins },
    { title: "المنح المستلمة", url: "/received-grants", icon: Wallet },
    { title: "تقارير الأثر", url: "/association-impact", icon: BarChart3 },
    { title: "العقود", url: "/contracts", icon: FileText },
    { title: "الفواتير", url: "/invoices", icon: Receipt },
    { title: "التقييمات", url: "/ratings", icon: BarChart3 },
    { title: "الشكاوى", url: "/my-disputes", icon: Gavel },
  ],
  service_provider: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "دليل الاستخدام", url: "/guide", icon: BookOpen },
    { title: "خدماتي", url: "/my-services", icon: Layers },
    { title: "طلبات الجمعيات", url: "/available-projects", icon: FolderKanban },
    { title: "طلباتي", url: "/my-projects", icon: FolderKanban },
    { title: "الرسائل", url: "/messages", icon: Mail },
    { title: "عروضي", url: "/my-bids", icon: FileText },
    { title: "العقود", url: "/contracts", icon: ScrollText },
    { title: "المعاملات المادية", url: "/earnings", icon: Receipt },
    { title: "الفواتير", url: "/invoices", icon: Receipt },
    { title: "التقييمات", url: "/ratings", icon: BarChart3 },
    { title: "الشكاوى", url: "/my-disputes", icon: Gavel },
    { title: "سوق الخدمات", url: "/marketplace", icon: Store },
  ],
  donor: [
    { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
    { title: "دليل الاستخدام", url: "/guide", icon: BookOpen },
    { title: "الجمعيات", url: "/associations", icon: Users },
    { title: "طلبات الدعم", url: "/grant-requests", icon: Heart },
    { title: "طلبات واردة", url: "/my-grant-requests", icon: Inbox },
    { title: "المنح", url: "/donations", icon: HandCoins },
    { title: "الفواتير", url: "/invoices", icon: Receipt },
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
    { title: "الفرضيات", url: "/admin/hypotheses", icon: ClipboardList },
    { title: "الإشعارات", url: "/admin/notifications", icon: Bell },
    { title: "تذاكر الدعم", url: "/admin/tickets", icon: MessageSquare },
    
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
  const homeItem = { title: "الصفحة الرئيسية", url: "/", icon: Home };
  const items = role ? [homeItem, ...menuByRole[role]] : [homeItem];
  const isNonAdmin = role && role !== "super_admin";

  // Unread notifications count
  const { data: unreadCount } = useUnreadCount();

  // Cart items count
  const cartCount = useCartCount();

  // Admin finance pending counts
  const { data: financePending } = useAdminFinancePending();

  // In-progress tickets count (admin sees all, non-admin sees own)
  const { data: activeTicketsCount } = useQuery({
    queryKey: ["sidebar-active-tickets", user?.id, role],
    queryFn: async () => {
      let q = supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .in("status", ["open", "in_progress"]);
      if (role !== "super_admin") {
        q = q.eq("user_id", user!.id);
      }
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  // New invoices count (status = 'issued')
  const { data: newInvoicesCount } = useQuery({
    queryKey: ["sidebar-new-invoices", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("issued_to", user!.id)
        .eq("status", "issued")
        .is("deleted_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  // Unsigned contracts count (for service_provider and youth_association)
  const { data: unsignedContractsCount } = useQuery({
    queryKey: ["sidebar-unsigned-contracts", user?.id, role],
    queryFn: async () => {
      if (role === "service_provider") {
        const { count, error } = await supabase
          .from("contracts")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", user!.id)
          .is("provider_signed_at", null)
          .is("deleted_at", null);
        if (error) throw error;
        return count ?? 0;
      }
      if (role === "youth_association") {
        const { count, error } = await supabase
          .from("contracts")
          .select("id", { count: "exact", head: true })
          .eq("association_id", user!.id)
          .is("association_signed_at", null)
          .is("deleted_at", null);
        if (error) throw error;
        return count ?? 0;
      }
      return 0;
    },
    enabled: !!user && (role === "service_provider" || role === "youth_association"),
  });

  // Pending grant requests counts
  const { data: grantRequestsCounts } = useQuery({
    queryKey: ["sidebar-grant-counts", user?.id, role],
    queryFn: async () => {
      const counts: Record<string, number> = {};

      if (role === "donor") {
        // طلبات الدعم: all pending grant requests
        const { count: allPending } = await supabase
          .from("grant_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        counts["/grant-requests"] = allPending ?? 0;

        // طلبات واردة: grant requests targeted to this donor
        const { count: incoming } = await supabase
          .from("grant_requests")
          .select("id", { count: "exact", head: true })
          .eq("donor_id", user!.id)
          .eq("status", "pending");
        counts["/my-grant-requests"] = incoming ?? 0;
      }

      if (role === "youth_association") {
        // طلبات المنح: my pending grant requests
        const { count: myGrants } = await supabase
          .from("grant_requests")
          .select("id", { count: "exact", head: true })
          .eq("association_id", user!.id)
          .eq("status", "pending");
        counts["/my-grants"] = myGrants ?? 0;

        // طلبات الجمعيات: my pending projects
        const { count: myProjects } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("association_id", user!.id)
          .is("deleted_at", null)
          .in("status", ["pending_approval", "open"]);
        counts["/projects"] = myProjects ?? 0;
      }

      if (role === "service_provider") {
        // طلبات الجمعيات المتاحة: open projects
        const { count: available } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "open");
        counts["/available-projects"] = available ?? 0;

        // طلباتي: my assigned in-progress projects
        const { count: myAssigned } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("assigned_provider_id", user!.id)
          .is("deleted_at", null)
          .eq("status", "in_progress");
        counts["/my-projects"] = myAssigned ?? 0;
      }

      if (role === "super_admin") {
        // طلبات الجمعيات: pending approval projects
        const { count: pendingProjects } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "pending_approval");
        counts["/admin/projects"] = pendingProjects ?? 0;

        // مستخدمون جدد غير موثقين
        const { count: newUsers } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("is_verified", false);
        counts["/admin/users"] = newUsers ?? 0;

        // خدمات بانتظار الموافقة
        const { count: pendingServices } = await supabase
          .from("micro_services")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("approval", "pending");
        counts["/admin/services"] = pendingServices ?? 0;
      }

      return counts;
    },
    enabled: !!user && !!role,
  });

  const getBadge = (url: string) => {
    if ((url === "/admin/notifications" || url === "/notifications") && (unreadCount ?? 0) > 0) return unreadCount;
    if ((url === "/admin/tickets" || url === "/tickets") && (activeTicketsCount ?? 0) > 0) return activeTicketsCount;
    if (url === "/cart" && cartCount > 0) return cartCount;
    if (url === "/admin/finance" && (financePending?.total ?? 0) > 0) return financePending!.total;
    if (url === "/invoices" && (newInvoicesCount ?? 0) > 0) return newInvoicesCount;
    if (url === "/contracts" && (role === "service_provider" || role === "youth_association") && (unsignedContractsCount ?? 0) > 0) return unsignedContractsCount;
    const grantCount = grantRequestsCounts?.[url];
    if (grantCount && grantCount > 0) return grantCount;
    return 0;
  };

  return (
    <Sidebar side="right">
      {/* User Profile Header */}
      <SidebarHeader className="p-5 pb-4">
        <div className="flex flex-col items-center text-center gap-3">
          <img src={logoWhiteImg} alt="منصة الخدمات المشتركة" className="h-16 w-auto object-contain mb-2" />
          <div className="relative">
            <Avatar className="h-14 w-14 border-[3px] border-sidebar-ring shadow-lg">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-sidebar-accent text-sidebar-accent-foreground font-bold">
                {(profile?.full_name?.[0] || "؟")}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 [inset-inline-end:-0.25rem] h-4 w-4 rounded-full bg-emerald-500 border-2 border-sidebar-background" />
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
                      <span className="text-sm flex-1">{item.title}</span>
                      {getBadge(item.url) > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full">
                          {getBadge(item.url)}
                        </Badge>
                      )}
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
              {isNonAdmin && (
                <>
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
                      <span className="text-sm flex-1">الإشعارات</span>
                      {(unreadCount ?? 0) > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full">
                          {unreadCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
                      <span className="text-sm flex-1">تذاكر الدعم</span>
                      {(activeTicketsCount ?? 0) > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full">
                          {activeTicketsCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                </>
              )}

              {role === "super_admin" && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/trash"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 group"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border-s-[3px] border-sidebar-ring"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/30 group-hover:bg-sidebar-accent/60 transition-colors">
                      <Trash2 className="h-[17px] w-[17px]" />
                    </div>
                    <span className="text-sm">سلة المحذوفات</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              )}

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
