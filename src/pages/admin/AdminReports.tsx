import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { Download, ChevronDown, FileText, Printer } from "lucide-react";
import { ReportFilters, getDefaultFilters, type ReportFilterValues } from "@/components/admin/ReportFilters";
import { PeriodComparison } from "@/components/admin/PeriodComparison";
import { generateReportPDF, captureChartAsImage } from "@/lib/report-pdf";
import { toast } from "sonner";

const STATUS_COLORS = ["#0D9488", "#FB923C", "#F59E0B", "#10B981", "#F43F5E", "#64748B"];
const ROLE_COLORS = ["#0D9488", "#FB923C", "#6366F1", "#8B5CF6"];

const statusLabels: Record<string, string> = {
  draft: "مسودة", open: "مفتوح", in_progress: "قيد التنفيذ",
  completed: "مكتمل", disputed: "مُشتكى عليه", cancelled: "ملغي",
  pending_approval: "بانتظار الموافقة", suspended: "معلق", archived: "مؤرشف",
};
const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام", youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة", donor: "مانح",
};

/* ─── Custom Tooltip ─── */
function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border border-border/50 bg-popover px-4 py-3 shadow-lg"
      style={{ direction: "rtl" }}
    >
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

/* ─── Custom Bar Label ─── */
function renderBarLabel(props: any) {
  const { x, y, width, value } = props;
  if (!value || value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 8} fill="#374151" textAnchor="middle" fontSize={11} fontWeight={600}>
      {typeof value === "number" ? value.toLocaleString() : value}
    </text>
  );
}

/* ─── Custom Pie Label ─── */
const RADIAN = Math.PI / 180;
function renderPieLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, value, percent } = props;
  if (!value || percent < 0.05) return null;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#374151" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={10} fontWeight={600}>
      {value.toLocaleString()}
    </text>
  );
}

/* ─── Shared axis / grid props ─── */
const gridProps = { strokeDasharray: "3 3", stroke: "hsl(var(--border))", vertical: false } as const;
const xAxisProps = { fontSize: 12, stroke: "hsl(var(--muted-foreground))", tickLine: false, axisLine: false } as const;
const yAxisProps = { ...xAxisProps } as const;
const chartCardCls = "rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-border/50 overflow-hidden";

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [filters, setFilters] = useState<ReportFilterValues>(getDefaultFilters);
  const { data: stats } = useAdminStats();
  const dateFrom = filters.dateFrom.toISOString();
  const dateTo = filters.dateTo.toISOString();
  const regionId = filters.regionId;

  // --- Filtered queries ---
  const { data: projectsByStatus } = useQuery({
    queryKey: ["admin-report-projects-status", dateFrom, dateTo, regionId],
    queryFn: async () => {
      let q = supabase.from("projects").select("status").gte("created_at", dateFrom).lte("created_at", dateTo);
      if (regionId) q = q.eq("region_id", regionId);
      const { data } = await q;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: any) => { counts[p.status] = (counts[p.status] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name: statusLabels[name] || name, value }));
    },
  });

  const { data: usersByRole } = useQuery({
    queryKey: ["admin-report-users-role", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { counts[r.role] = (counts[r.role] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name: roleLabels[name] || name, value }));
    },
  });

  const { data: monthlyDonations } = useQuery({
    queryKey: ["admin-report-donations", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase.from("donor_contributions").select("amount, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
      const months: Record<string, number> = {};
      (data ?? []).forEach((d: any) => {
        const key = format(startOfMonth(parseISO(d.created_at)), "yyyy-MM");
        months[key] = (months[key] || 0) + Number(d.amount);
      });
      return Object.entries(months).sort().map(([month, amount]) => ({ month, amount }));
    },
  });

  const { data: servicesByCategory } = useQuery({
    queryKey: ["admin-report-services-category", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase.from("micro_services").select("category_id, categories(name)").gte("created_at", dateFrom).lte("created_at", dateTo);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((s: any) => {
        const name = s.categories?.name || "بدون تصنيف";
        counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: projectsByRegion } = useQuery({
    queryKey: ["admin-report-projects-region", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("region_id, regions(name)").gte("created_at", dateFrom).lte("created_at", dateTo);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: any) => {
        const name = p.regions?.name || "بدون منطقة";
        counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: serviceApprovalStats } = useQuery({
    queryKey: ["admin-report-service-approval", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase.from("micro_services").select("approval").gte("created_at", dateFrom).lte("created_at", dateTo);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((s: any) => { counts[s.approval] = (counts[s.approval] || 0) + 1; });
      const labels: Record<string, string> = { pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض" };
      return Object.entries(counts).map(([name, value]) => ({ name: labels[name] || name, value }));
    },
  });

  const { data: monthlyEscrow } = useQuery({
    queryKey: ["admin-report-monthly-escrow", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase.from("escrow_transactions").select("amount, status, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
      const months: Record<string, { total: number; released: number }> = {};
      (data ?? []).forEach((e: any) => {
        const key = format(startOfMonth(parseISO(e.created_at)), "yyyy-MM");
        if (!months[key]) months[key] = { total: 0, released: 0 };
        months[key].total += Number(e.amount);
        if (e.status === "released") months[key].released += Number(e.amount);
      });
      return Object.entries(months).sort().map(([month, v]) => ({ month, total: v.total, released: v.released }));
    },
  });

  const { data: hourlyRateData } = useQuery({
    queryKey: ["admin-report-hourly-rates"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("hourly_rate").not("hourly_rate", "is", null);
      const rates = (data ?? []).map((p: any) => Number(p.hourly_rate)).filter(r => r > 0);
      if (!rates.length) return { avg: 0, distribution: [] };
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      const buckets: Record<string, number> = {};
      rates.forEach(r => {
        const bucket = `${Math.floor(r / 50) * 50}-${Math.floor(r / 50) * 50 + 49}`;
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      });
      return { avg, distribution: Object.entries(buckets).map(([range, count]) => ({ range, count })) };
    },
  });

  const { data: donorAnalytics } = useQuery({
    queryKey: ["admin-report-donor-analytics", dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await supabase.from("donor_contributions").select("donor_id, amount, project_id, association_id, projects(title), profiles!donor_contributions_donor_id_fkey(full_name, organization_name)").gte("created_at", dateFrom).lte("created_at", dateTo);
      const donors = new Set((data ?? []).map((d: any) => d.donor_id));
      const totalGrants = (data ?? []).reduce((s, d: any) => s + Number(d.amount), 0);
      const byProject: Record<string, number> = {};
      (data ?? []).forEach((d: any) => {
        const name = (d.projects as any)?.title || "خدمة";
        byProject[name] = (byProject[name] || 0) + Number(d.amount);
      });

      // Per-donor: charities supported + total amount
      const donorMap: Record<string, { name: string; associations: Set<string>; total: number }> = {};
      (data ?? []).forEach((d: any) => {
        if (!donorMap[d.donor_id]) {
          const profile = d.profiles as any;
          donorMap[d.donor_id] = {
            name: profile?.organization_name || profile?.full_name || "مانح",
            associations: new Set(),
            total: 0,
          };
        }
        if (d.association_id) donorMap[d.donor_id].associations.add(d.association_id);
        donorMap[d.donor_id].total += Number(d.amount);
      });
      const perDonor = Object.values(donorMap).map((d) => ({
        name: d.name,
        charities: d.associations.size,
        amount: d.total,
      }));

      return {
        totalDonors: donors.size,
        totalGrants,
        byProject: Object.entries(byProject).map(([name, amount]) => ({ name, amount })),
        perDonor,
      };
    },
  });

  // --- Export functions ---
  const exportUsers = async () => {
    const { data } = await supabase.from("profiles").select("full_name, phone, organization_name, is_verified, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
    downloadCSV("users.csv", ["الاسم", "الهاتف", "المنظمة", "موثق", "تاريخ الانضمام"],
      (data ?? []).map((u: any) => [u.full_name, u.phone ?? "", u.organization_name ?? "", u.is_verified ? "نعم" : "لا", u.created_at?.slice(0, 10)]));
  };
  const exportProjects = async () => {
    let q = supabase.from("projects").select("id, title, status, budget, created_at, regions(name), categories(name)").gte("created_at", dateFrom).lte("created_at", dateTo);
    if (regionId) q = q.eq("region_id", regionId);
    const { data } = await q;
    downloadCSV("projects.csv", ["المعرف", "العنوان", "الحالة", "الميزانية", "المنطقة", "التصنيف", "تاريخ الإنشاء"],
      (data ?? []).map((p: any) => [p.id, p.title, p.status, p.budget ?? "", (p.regions as any)?.name ?? "", (p.categories as any)?.name ?? "", p.created_at?.slice(0, 10)]));
  };
  const exportServices = async () => {
    const { data } = await supabase.from("micro_services").select("title, price, approval, created_at, categories(name), profiles!micro_services_provider_id_fkey(full_name)").gte("created_at", dateFrom).lte("created_at", dateTo);
    downloadCSV("services.csv", ["العنوان", "مقدم الخدمة", "السعر", "التصنيف", "الحالة", "تاريخ الإنشاء"],
      (data ?? []).map((s: any) => [s.title, (s.profiles as any)?.full_name ?? "", s.price, (s.categories as any)?.name ?? "", s.approval, s.created_at?.slice(0, 10)]));
  };
  const exportFinancial = async () => {
    const { data } = await supabase.from("escrow_transactions").select("amount, status, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
    downloadCSV("financial.csv", ["المبلغ", "الحالة", "تاريخ الإنشاء"],
      (data ?? []).map((e: any) => [e.amount, e.status, e.created_at?.slice(0, 10)]));
  };
  const exportInvoices = async () => {
    const { data } = await supabase.from("invoices").select("invoice_number, amount, commission_amount, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
    downloadCSV("invoices.csv", ["رقم الفاتورة", "المبلغ", "العمولة", "تاريخ الإنشاء"],
      (data ?? []).map((i: any) => [i.invoice_number, i.amount, i.commission_amount, i.created_at?.slice(0, 10)]));
  };

  // Chart refs for PDF capture
  const chartRefs = useRef<{ title: string; ref: HTMLDivElement | null }[]>([]);
  const setChartRef = (index: number, title: string) => (el: HTMLDivElement | null) => {
    chartRefs.current[index] = { title, ref: el };
  };

  const exportPDF = async () => {
    try {
      toast.info("جارٍ إعداد التقرير...");
      const chartImages: { title: string; imageDataUrl: string }[] = [];
      for (const item of chartRefs.current) {
        if (!item?.ref) continue;
        try {
          const dataUrl = await captureChartAsImage(item.ref);
          chartImages.push({ title: item.title, imageDataUrl: dataUrl });
        } catch { /* skip */ }
      }
      const sections = [];
      if (projectsByStatus?.length) {
        sections.push({ title: "الطلبات حسب الحالة", headers: ["الحالة", "العدد"], rows: projectsByStatus.map((p) => [p.name, String(p.value)]) });
      }
      if (projectsByRegion?.length) {
        sections.push({ title: "الطلبات حسب المنطقة", headers: ["المنطقة", "العدد"], rows: projectsByRegion.map((p) => [p.name, String(p.value)]) });
      }
      if (monthlyDonations?.length) {
        sections.push({ title: "المنح", headers: ["الشهر", "المبلغ (ر.س)"], rows: monthlyDonations.map((d) => [d.month, String(d.amount)]) });
      }
      if (monthlyEscrow?.length) {
        sections.push({ title: "المعاملات المالية الشهرية", headers: ["الشهر", "الإجمالي (ر.س)", "المحرّر (ر.س)"], rows: monthlyEscrow.map((e) => [e.month, String(e.total), String(e.released)]) });
      }
      await generateReportPDF(
        "تقرير تحليلات المنصة",
        { from: filters.dateFrom, to: filters.dateTo },
        sections,
        [
          { label: "المستخدمين", value: String(stats?.totalUsers ?? 0) },
          { label: "طلبات الجمعيات", value: String(stats?.totalProjects ?? 0) },
          { label: "الإيرادات (ر.س)", value: (stats?.revenue ?? 0).toLocaleString() },
          { label: "الشكاوى المفتوحة", value: String(stats?.openDisputes ?? 0) },
        ],
        chartImages
      );
      toast.success("تم تصدير التقرير بصيغة PDF");
    } catch (err) {
      toast.error("حدث خطأ أثناء تصدير PDF");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">التقارير والتحليلات</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()} className="gap-1">
              <Printer className="h-4 w-4" />طباعة
            </Button>
            <Button variant="outline" onClick={exportPDF} className="gap-1">
              <FileText className="h-4 w-4" />تصدير PDF
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 me-2" />CSV<ChevronDown className="h-4 w-4 ms-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportUsers}>تصدير المستخدمين</DropdownMenuItem>
                <DropdownMenuItem onClick={exportProjects}>تصدير الطلبات</DropdownMenuItem>
                <DropdownMenuItem onClick={exportServices}>تصدير الخدمات</DropdownMenuItem>
                <DropdownMenuItem onClick={exportFinancial}>تصدير المالية</DropdownMenuItem>
                <DropdownMenuItem onClick={exportInvoices}>تصدير الفواتير</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <ReportFilters filters={filters} onChange={setFilters} />
          </CardContent>
        </Card>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">المستخدمين</p><p className="text-2xl font-bold">{stats?.totalUsers ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">طلبات الجمعيات</p><p className="text-2xl font-bold">{stats?.totalProjects ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">الشكاوى المفتوحة</p><p className="text-2xl font-bold">{stats?.openDisputes ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">الإيرادات</p><p className="text-2xl font-bold">{(stats?.revenue ?? 0).toLocaleString()} ر.س</p></CardContent></Card>
        </div>

        {/* Period Comparison */}
        <PeriodComparison dateFrom={filters.dateFrom} dateTo={filters.dateTo} regionId={filters.regionId} />

        {/* ═══════════ Charts ═══════════ */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie: الطلبات حسب الحالة */}
          <Card ref={setChartRef(1, "الطلبات حسب الحالة")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">الطلبات حسب الحالة</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={projectsByStatus ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} cornerRadius={4} label={renderPieLabel} labelLine={false} animationDuration={800} animationEasing="ease-out">
                    {(projectsByStatus ?? []).map((_: any, i: number) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar: المستخدمين حسب الدور */}
          <Card ref={setChartRef(2, "المستخدمين حسب الدور")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">المستخدمين حسب الدور</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={usersByRole ?? []} margin={{ top: 20 }}>
                  <defs>
                    {ROLE_COLORS.map((c, i) => (
                      <linearGradient key={i} id={`roleGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={1} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                    {(usersByRole ?? []).map((_: any, i: number) => <Cell key={i} fill={`url(#roleGrad${i % ROLE_COLORS.length})`} />)}
                    <LabelList dataKey="value" content={renderBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie: الخدمات حسب التصنيف */}
          <Card ref={setChartRef(3, "الخدمات حسب التصنيف")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">الخدمات حسب التصنيف</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={servicesByCategory ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} cornerRadius={4} label={renderPieLabel} labelLine={false} animationDuration={800} animationEasing="ease-out">
                    {(servicesByCategory ?? []).map((_: any, i: number) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar: الطلبات حسب المنطقة */}
          <Card ref={setChartRef(4, "الطلبات حسب المنطقة")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">الطلبات حسب المنطقة</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={projectsByRegion ?? []} margin={{ top: 20 }}>
                  <defs>
                    <linearGradient id="regionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="value" fill="url(#regionGrad)" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                    <LabelList dataKey="value" content={renderBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Bar: المنح */}
          <Card ref={setChartRef(5, "المنح")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">المنح</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyDonations ?? []} margin={{ top: 20 }}>
                  <defs>
                    <linearGradient id="donationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FB923C" stopOpacity={1} />
                      <stop offset="100%" stopColor="#FB923C" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="amount" fill="url(#donationGrad)" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out" name="المبلغ">
                    <LabelList dataKey="amount" content={renderBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie: حالة الخدمات */}
          <Card ref={setChartRef(6, "حالة الخدمات")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">حالة الخدمات</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={serviceApprovalStats ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} cornerRadius={4} label={renderPieLabel} labelLine={false} animationDuration={800} animationEasing="ease-out">
                    {(serviceApprovalStats ?? []).map((_: any, i: number) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Bar: المعاملات المالية الشهرية */}
          <Card ref={setChartRef(7, "المعاملات المالية الشهرية")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">المعاملات المالية الشهرية</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyEscrow ?? []} margin={{ top: 20 }}>
                  <defs>
                    <linearGradient id="escrowTotalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="escrowRelGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="total" fill="url(#escrowTotalGrad)" name="إجمالي" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                    <LabelList dataKey="total" content={renderBarLabel} />
                  </Bar>
                  <Bar dataKey="released" fill="url(#escrowRelGrad)" name="محرّر" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                    <LabelList dataKey="released" content={renderBarLabel} />
                  </Bar>
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar: توزيع أسعار الساعة */}
          <Card className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">توزيع أسعار الساعة</CardTitle></CardHeader>
            <CardContent className="p-6">
              {hourlyRateData?.avg ? (
                <>
                  <p className="text-sm text-muted-foreground mb-3 text-center">المتوسط: <span className="font-bold text-foreground">{hourlyRateData.avg.toFixed(0)} ر.س/ساعة</span></p>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={hourlyRateData.distribution} margin={{ top: 20 }}>
                      <defs>
                        <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="range" {...xAxisProps} />
                      <YAxis {...yAxisProps} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar dataKey="count" fill="url(#hourlyGrad)" name="عدد" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                        <LabelList dataKey="count" content={renderBarLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Donor Analytics */}
        <Card ref={setChartRef(8, "تحليلات المانحين")} className={chartCardCls}>
          <CardHeader><CardTitle className="text-lg text-center">تحليلات المانحين</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">عدد المانحين</p>
                <p className="text-2xl font-bold">{donorAnalytics?.totalDonors ?? 0}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">إجمالي المنح</p>
                <p className="text-2xl font-bold">{(donorAnalytics?.totalGrants ?? 0).toLocaleString()} ر.س</p>
              </div>
            </div>
            {donorAnalytics?.byProject?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={donorAnalytics.byProject} margin={{ top: 20 }}>
                  <defs>
                    <linearGradient id="donorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity={1} />
                      <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="amount" fill="url(#donorGrad)" name="المبلغ" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                    <LabelList dataKey="amount" content={renderBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        {/* Per-Donor Contributions Chart */}
        {donorAnalytics?.perDonor?.length ? (
          <Card ref={setChartRef(9, "مساهمات المانحين")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">مساهمات المانحين والرعاة</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={donorAnalytics.perDonor} barGap={8} margin={{ top: 20 }}>
                  <defs>
                    <linearGradient id="donorCharitiesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="donorAmountGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity={1} />
                      <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...xAxisProps} />
                  <YAxis yAxisId="left" {...yAxisProps} label={{ value: "عدد الجمعيات", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }} />
                  <YAxis yAxisId="right" orientation="right" {...yAxisProps} label={{ value: "المبلغ (ر.س)", angle: 90, position: "insideRight", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="charities" fill="url(#donorCharitiesGrad)" name="عدد الجمعيات المدعومة" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                    <LabelList dataKey="charities" content={renderBarLabel} />
                  </Bar>
                  <Bar yAxisId="right" dataKey="amount" fill="url(#donorAmountGrad)" name="إجمالي المنح (ر.س)" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                    <LabelList dataKey="amount" content={renderBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
