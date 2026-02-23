import { DashboardLayout } from "@/components/DashboardLayout";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useAuth } from "@/hooks/useAuth";
import { useProjectStats } from "@/hooks/useProjects";
import { useProviderStats } from "@/hooks/useProviderStats";
import { useDonorStats } from "@/hooks/useDonorStats";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FolderKanban, Users, Receipt, BarChart3, HandCoins, ClipboardList, Gavel, Layers,
} from "lucide-react";

const roleTitles: Record<string, string> = {
  super_admin: "لوحة تحكم المدير",
  youth_association: "لوحة تحكم الجمعية",
  service_provider: "لوحة تحكم مقدم الخدمة",
  donor: "لوحة تحكم المانح",
};

function AssociationDashboard() {
  const { data: stats, isLoading } = useProjectStats();
  const items = [
    { title: "المشاريع النشطة", value: stats?.activeProjects ?? 0, icon: FolderKanban, color: "text-primary" },
    { title: "ساعات قيد المراجعة", value: stats?.pendingHours ?? 0, icon: ClipboardList, color: "text-warning" },
    { title: "العقود الجارية", value: stats?.activeContracts ?? 0, icon: Receipt, color: "text-info" },
    { title: "متوسط التقييم", value: stats?.avgRating ?? "0", icon: BarChart3, color: "text-success" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProviderDashboard() {
  const { data: stats, isLoading } = useProviderStats();
  const items = [
    { title: "خدماتي", value: stats?.servicesCount ?? 0, icon: Layers, color: "text-primary" },
    { title: "العروض المقدمة", value: stats?.activeBids ?? 0, icon: FolderKanban, color: "text-info" },
    { title: "الساعات المسجلة", value: stats?.hoursThisMonth ?? 0, icon: ClipboardList, color: "text-warning" },
    { title: "إجمالي الأرباح", value: `${(stats?.totalEarnings ?? 0).toLocaleString()} ر.س`, icon: Receipt, color: "text-success" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DonorDashboard() {
  const { data: stats, isLoading } = useDonorStats();
  const items = [
    { title: "الجمعيات المدعومة", value: stats?.associationsSupported ?? 0, icon: Users, color: "text-primary" },
    { title: "إجمالي التبرعات", value: `${(stats?.totalDonations ?? 0).toLocaleString()} ر.س`, icon: HandCoins, color: "text-accent" },
    { title: "المشاريع الممولة", value: stats?.projectsFunded ?? 0, icon: FolderKanban, color: "text-info" },
    { title: "تقارير الأثر", value: "0", icon: BarChart3, color: "text-success" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const items = [
    { title: "إجمالي المستخدمين", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { title: "المشاريع", value: stats?.totalProjects ?? 0, icon: FolderKanban, color: "text-info" },
    { title: "النزاعات المفتوحة", value: stats?.openDisputes ?? 0, icon: Gavel, color: "text-destructive" },
    { title: "الإيرادات", value: `${(stats?.revenue ?? 0).toLocaleString()} ر.س`, icon: Receipt, color: "text-success" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
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
  const title = role ? roleTitles[role] : "لوحة التحكم";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm mt-1">مرحباً بك في منصة الخدمات المشتركة</p>
        </div>
        {role ? <DashboardStats role={role} /> : null}
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
}
