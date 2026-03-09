import { DashboardLayout } from "@/components/DashboardLayout";

import { AdminOverview } from "@/components/admin/AdminOverview";
import { useAuth } from "@/hooks/useAuth";
import { useProjectStats } from "@/hooks/useProjects";
import { useProviderStats } from "@/hooks/useProviderStats";
import { useDonorStats } from "@/hooks/useDonorStats";
import { useImpactReportsCount } from "@/hooks/useImpactReports";
import { usePendingRatings } from "@/hooks/usePendingRatings";
import { useProfile } from "@/hooks/useProfile";
import { useAssociationGrantStats } from "@/hooks/useAssociationGrants";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderKanban, Users, Receipt, BarChart3, HandCoins, ClipboardList, Gavel, Layers, Star, CalendarDays, Wallet,
  Clock, FileSignature, AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { JourneyBoard } from "@/components/dashboard/JourneyBoard";
import { PlatformOverview } from "@/components/dashboard/PlatformOverview";
import { AssociationActionItems } from "@/components/dashboard/AssociationActionItems";
import { DonorActionItems } from "@/components/donor/DonorActionItems";

const roleTitles: Record<string, string> = {
  super_admin: "لوحة تحكم المدير",
  youth_association: "لوحة تحكم الجمعية",
  service_provider: "لوحة تحكم مقدم الخدمة",
  donor: "لوحة تحكم المانح",
};

interface StatItem {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", border: "border-s-primary" },
    warning: { bg: "bg-warning/10", text: "text-warning", border: "border-s-warning" },
    info: { bg: "bg-info/10", text: "text-info", border: "border-s-info" },
    success: { bg: "bg-success/10", text: "text-success", border: "border-s-success" },
    accent: { bg: "bg-accent/10", text: "text-accent-foreground", border: "border-s-accent" },
    destructive: { bg: "bg-destructive/10", text: "text-destructive", border: "border-s-destructive" },
  };
  const c = colorMap[stat.color] || colorMap.primary;

  return (
    <Card className={cn(
      "card-hover border-s-4 animate-fade-in",
      c.border,
      `stagger-${index + 1}`
    )} style={{ animationFillMode: 'both' }}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center sm:items-start justify-between gap-2">
          <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">{stat.value}</p>
          </div>
          <div className={cn("p-2 sm:p-3 rounded-xl shrink-0", c.bg)}>
            <stat.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", c.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsGrid({ items, isLoading }: { items: StatItem[]; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {items.map((stat, i) => (
        <StatCard key={stat.title} stat={{ ...stat, value: isLoading ? "..." : stat.value }} index={i} />
      ))}
    </div>
  );
}

function AssociationDashboard() {
  const { data: stats, isLoading } = useProjectStats();
  const { data: grantStats } = useAssociationGrantStats();
  const items: StatItem[] = [
    { title: "إجمالي الطلبات", value: stats?.totalRequests ?? 0, icon: Layers, color: "accent" },
    { title: "المشاريع النشطة", value: stats?.activeProjects ?? 0, icon: FolderKanban, color: "primary" },
    { title: "إجمالي المنح", value: `${(grantStats?.totalGrants ?? 0).toLocaleString()} ر.س`, icon: HandCoins, color: "info" },
    { title: "رصيد المنح المتبقي", value: `${(grantStats?.availableBalance ?? 0).toLocaleString()} ر.س`, icon: Wallet, color: "success" },
    { title: "العقود الجارية", value: stats?.activeContracts ?? 0, icon: Receipt, color: "warning" },
  ];
  return <StatsGrid items={items} isLoading={isLoading} />;
}

function ProviderDashboard() {
  const { data: stats, isLoading } = useProviderStats();
  const items: StatItem[] = [
    { title: "المشاريع النشطة", value: stats?.activeProjects ?? 0, icon: FolderKanban, color: "primary" },
    { title: "خدماتي", value: stats?.servicesCount ?? 0, icon: Layers, color: "info" },
    { title: "العروض المقدمة", value: stats?.activeBids ?? 0, icon: ClipboardList, color: "warning" },
    { title: "إجمالي الأرباح", value: `${(stats?.totalEarnings ?? 0).toLocaleString()} ر.س`, icon: Receipt, color: "success" },
    { title: "ساعات هذا الشهر", value: stats?.hoursThisMonth ?? 0, icon: Clock, color: "accent" },
  ];
  return <StatsGrid items={items} isLoading={isLoading} />;
}

/** Provider action items: unsigned contracts, pending withdrawals */
function ProviderActionItems() {
  const { user } = useAuth();

  const { data: unsignedContracts } = useQuery({
    queryKey: ["provider-unsigned-contracts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, project_id, projects:project_id(title)")
        .eq("provider_id", user!.id)
        .is("provider_signed_at", null)
        .is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pendingWithdrawals } = useQuery({
    queryKey: ["provider-pending-withdrawals-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("withdrawal_requests")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (!unsignedContracts?.length && !pendingWithdrawals) return null;

  return (
    <div className="space-y-2">
      {(unsignedContracts?.length ?? 0) > 0 && (
        <Alert className="border-primary bg-primary/5 animate-fade-in">
          <FileSignature className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span>لديك {unsignedContracts!.length} عقود بحاجة إلى توقيعك</span>
            <Link to="/my-bids" className="text-sm font-medium text-primary underline">عرض العروض</Link>
          </AlertDescription>
        </Alert>
      )}
      {(pendingWithdrawals ?? 0) > 0 && (
        <Alert className="border-warning bg-warning/5 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between">
            <span>{pendingWithdrawals} طلب سحب قيد المراجعة</span>
            <Link to="/earnings" className="text-sm font-medium text-primary underline">المعاملات</Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function DonorDashboard() {
  const { data: stats, isLoading } = useDonorStats();
  const { data: reportsCount } = useImpactReportsCount();
  const items: StatItem[] = [
    { title: "الجمعيات المدعومة", value: stats?.associationsSupported ?? 0, icon: Users, color: "primary" },
    { title: "إجمالي المنح", value: `${(stats?.totalDonations ?? 0).toLocaleString()} ر.س`, icon: HandCoins, color: "accent" },
    { title: "الرصيد المتاح", value: `${(stats?.availableBalance ?? 0).toLocaleString()} ر.س`, icon: Wallet, color: "info" },
    { title: "تقارير الأثر", value: reportsCount ?? 0, icon: BarChart3, color: "success" },
  ];
  return (
    <div className="space-y-4">
      <StatsGrid items={items} isLoading={isLoading} />
      {!isLoading && (stats?.totalDonations ?? 0) > 0 && (
        <Card className="border-s-4 border-s-accent bg-accent/5 animate-fade-in">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl bg-accent/10 shrink-0">
              <HandCoins className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
            </div>
            <p className="text-xs sm:text-sm font-medium leading-relaxed">
              الله يجزاك خير! دعمك وصل وأثره بيّن، شكراً لك من القلب على عطائك الكريم 🤍
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdminDashboard() {
  return <AdminOverview />;
}

function DashboardStats({ role }: { role: string }) {
  if (role === "youth_association") return <AssociationDashboard />;
  if (role === "service_provider") return <ProviderDashboard />;
  if (role === "donor") return <DonorDashboard />;
  if (role === "super_admin") return <AdminDashboard />;
  return null;
}

export default function Dashboard() {
  const { role, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: pendingRatings } = usePendingRatings();
  const title = role ? roleTitles[role] : "لوحة التحكم";

  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome section */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{profile?.full_name ? `مرحباً، ${profile.full_name}` : title}</h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
            <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{today}</span>
          </div>
        </div>

        {/* Action items */}
        {role === "service_provider" && <ProviderActionItems />}
        {role === "youth_association" && <AssociationActionItems />}
        {role === "donor" && <DonorActionItems />}

        {pendingRatings && pendingRatings.length > 0 && (
          <Alert className="border-warning bg-warning/10 animate-fade-in">
            <Star className="h-4 w-4 text-warning" />
            <AlertDescription className="flex items-center justify-between">
              <span>لديك {pendingRatings.length} عقود بحاجة إلى تقييم</span>
              <Link to="/ratings" className="text-sm font-medium text-primary underline">تقييم الآن</Link>
            </AlertDescription>
          </Alert>
        )}
        {role ? <DashboardStats role={role} /> : null}
        {role && role !== "super_admin" && <PlatformOverview />}
        {role && role !== "super_admin" && <JourneyBoard role={role} />}
        
      </div>
    </DashboardLayout>
  );
}
