import { useAdminStats, useAdminGrowthData, usePlatformHealth } from "@/hooks/useAdminStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, FolderKanban, Gavel, Receipt, Layers, ClipboardList, Shield, Ticket,
  TrendingUp, CheckCircle2, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList,
} from "recharts";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary", border: "border-s-primary" },
  warning: { bg: "bg-warning/10", text: "text-warning", border: "border-s-warning" },
  info: { bg: "bg-info/10", text: "text-info", border: "border-s-info" },
  success: { bg: "bg-success/10", text: "text-success", border: "border-s-success" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", border: "border-s-destructive" },
  accent: { bg: "bg-accent/10", text: "text-accent-foreground", border: "border-s-accent" },
};

function KPICard({ title, value, icon: Icon, color, subtitle }: KPICardProps) {
  const c = colorMap[color] || colorMap.primary;
  return (
    <Card className={cn("border-s-4 animate-fade-in", c.border)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl", c.bg)}>
            <Icon className={cn("h-5 w-5", c.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{value}%</span>
      </div>
      <Progress value={value} className={cn("h-2", color === "success" && "[&>div]:bg-success", color === "primary" && "[&>div]:bg-primary", color === "info" && "[&>div]:bg-info")} />
    </div>
  );
}

/* ─── Custom Tooltip ─── */
function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-popover px-4 py-3 shadow-lg" style={{ direction: "rtl" }}>
      {label && <p className="mb-1.5 text-xs font-bold text-foreground">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name ?? entry.dataKey}:</span>
          <span className="font-semibold tabular-nums text-foreground">
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const chartCardCls = "rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-border/50 overflow-hidden animate-fade-in";
const gridProps = { strokeDasharray: "3 3", stroke: "hsl(var(--border))", vertical: false } as const;
const axisProps = { fontSize: 12, stroke: "hsl(var(--muted-foreground))", tickLine: false, axisLine: false } as const;

export function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: growth, isLoading: growthLoading } = useAdminGrowthData();
  const { data: health, isLoading: healthLoading } = usePlatformHealth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const kpis = [
    { title: "إجمالي المستخدمين", value: stats?.totalUsers ?? 0, icon: Users, color: "primary" },
    { title: "طلبات الجمعيات", value: stats?.totalProjects ?? 0, icon: FolderKanban, color: "info" },
    { title: "الشكاوى المفتوحة", value: stats?.openDisputes ?? 0, icon: Gavel, color: "destructive" },
    { title: "الإيرادات", value: `${(stats?.revenue ?? 0).toLocaleString()} ر.س`, icon: Receipt, color: "success" },
    { title: "خدمات بانتظار الموافقة", value: stats?.pendingServices ?? 0, icon: Layers, color: "warning" },
    { title: "عروض أسعار معلقة", value: stats?.pendingBids ?? 0, icon: ClipboardList, color: "accent" },
    { title: "ضمان محتجز", value: `${(stats?.heldEscrow ?? 0).toLocaleString()} ر.س`, icon: Shield, color: "primary", subtitle: "مبلغ الضمان المالي المحتجز" },
    { title: "تذاكر الدعم المفتوحة", value: stats?.openTickets ?? 0, icon: Ticket, color: "warning" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Growth Chart */}
        <Card className={cn("md:col-span-2", chartCardCls)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-center flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              نمو المنصة - آخر 6 أشهر
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {growthLoading ? (
              <Skeleton className="h-[250px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={growth ?? []}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#colorUsers)" name="مستخدمون جدد" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="projects" stroke="hsl(var(--info))" fill="url(#colorProjects)" name="طلبات جديدة" strokeWidth={2.5} dot={false}>
                    <LabelList dataKey="projects" position="top" fontSize={10} fontWeight={600} fill="#374151" formatter={(v: number) => v ? v.toLocaleString() : ''} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card className={chartCardCls}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-center flex items-center justify-center gap-2">
              <Activity className="h-5 w-5 text-success" />
              صحة المنصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {healthLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <>
                <HealthMetric label="معدل إكمال الطلبات" value={health?.completionRate ?? 0} color="success" />
                <HealthMetric label="معدل حل الشكاوى" value={health?.disputeResolutionRate ?? 0} color="primary" />
                <HealthMetric label="نجاح المعاملات المالية" value={health?.escrowSuccessRate ?? 0} color="info" />
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      طلبات نشطة
                    </span>
                    <span className="font-bold">{health?.activeProjects ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Gavel className="h-3.5 w-3.5 text-destructive" />
                      إجمالي الشكاوى
                    </span>
                    <span className="font-bold">{health?.totalDisputes ?? 0}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card className={chartCardCls}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-center flex items-center justify-center gap-2">
            <Receipt className="h-5 w-5 text-success" />
            التدفق المالي - آخر 6 أشهر
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {growthLoading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growth ?? []}>
                <defs>
                  <linearGradient id="colorEscrow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="escrow" stroke="hsl(var(--success))" fill="url(#colorEscrow)" name="معاملات الضمان (ر.س)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="donations" stroke="hsl(var(--accent-foreground))" fill="url(#colorDonations)" name="المنح (ر.س)" strokeWidth={2.5} dot={false}>
                  <LabelList dataKey="donations" position="top" fontSize={10} fontWeight={600} fill="#374151" formatter={(v: number) => v ? v.toLocaleString() : ''} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
