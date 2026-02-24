import { DashboardLayout } from "@/components/DashboardLayout";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useAuth } from "@/hooks/useAuth";
import { useProjectStats } from "@/hooks/useProjects";
import { useProviderStats } from "@/hooks/useProviderStats";
import { useDonorStats } from "@/hooks/useDonorStats";
import { useAdminStats } from "@/hooks/useAdminStats";
import { usePendingRatings } from "@/hooks/usePendingRatings";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  FolderKanban, Users, Receipt, BarChart3, HandCoins, ClipboardList, Gavel, Layers, Star, CalendarDays,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  color: string; // tailwind color token e.g. "primary", "info"
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
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
          </div>
          <div className={cn("p-3 rounded-xl", c.bg)}>
            <stat.icon className={cn("h-6 w-6", c.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsGrid({ items, isLoading }: { items: StatItem[]; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat, i) => (
        <StatCard key={stat.title} stat={{ ...stat, value: isLoading ? "..." : stat.value }} index={i} />
      ))}
    </div>
  );
}

function AssociationDashboard() {
  const { data: stats, isLoading } = useProjectStats();
  const items: StatItem[] = [
    { title: "المشاريع النشطة", value: stats?.activeProjects ?? 0, icon: FolderKanban, color: "primary" },
    { title: "ساعات قيد المراجعة", value: stats?.pendingHours ?? 0, icon: ClipboardList, color: "warning" },
    { title: "العقود الجارية", value: stats?.activeContracts ?? 0, icon: Receipt, color: "info" },
    { title: "متوسط التقييم", value: stats?.avgRating ?? "0", icon: BarChart3, color: "success" },
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
  ];
  return <StatsGrid items={items} isLoading={isLoading} />;
}

function DonorDashboard() {
  const { data: stats, isLoading } = useDonorStats();
  const items: StatItem[] = [
    { title: "الجمعيات المدعومة", value: stats?.associationsSupported ?? 0, icon: Users, color: "primary" },
    { title: "إجمالي التبرعات", value: `${(stats?.totalDonations ?? 0).toLocaleString()} ر.س`, icon: HandCoins, color: "accent" },
    { title: "المشاريع الممولة", value: stats?.projectsFunded ?? 0, icon: FolderKanban, color: "info" },
    { title: "تقارير الأثر", value: "0", icon: BarChart3, color: "success" },
  ];
  return <StatsGrid items={items} isLoading={isLoading} />;
}

function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const items: StatItem[] = [
    { title: "إجمالي المستخدمين", value: stats?.totalUsers ?? 0, icon: Users, color: "primary" },
    { title: "المشاريع", value: stats?.totalProjects ?? 0, icon: FolderKanban, color: "info" },
    { title: "النزاعات المفتوحة", value: stats?.openDisputes ?? 0, icon: Gavel, color: "destructive" },
    { title: "الإيرادات", value: `${(stats?.revenue ?? 0).toLocaleString()} ر.س`, icon: Receipt, color: "success" },
  ];
  return <StatsGrid items={items} isLoading={isLoading} />;
}

function DashboardStats({ role }: { role: string }) {
  if (role === "youth_association") return <AssociationDashboard />;
  if (role === "service_provider") return <ProviderDashboard />;
  if (role === "donor") return <DonorDashboard />;
  if (role === "super_admin") return <AdminDashboard />;
  return null;
}

export default function Dashboard() {
  const { role } = useAuth();
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
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{profile?.full_name ? `مرحباً، ${profile.full_name}` : title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>{today}</span>
            </div>
          </div>
        </div>

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
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
}
