import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { Download, ChevronDown, FileText } from "lucide-react";
import { ReportFilters, getDefaultFilters, type ReportFilterValues } from "@/components/admin/ReportFilters";
import { PeriodComparison } from "@/components/admin/PeriodComparison";
import { generateReportPDF } from "@/lib/report-pdf";
import { toast } from "sonner";

const STATUS_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#ef4444", "#6b7280"];
const ROLE_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#6366f1"];

const statusLabels: Record<string, string> = {
  draft: "مسودة", open: "مفتوح", in_progress: "قيد التنفيذ",
  completed: "مكتمل", disputed: "متنازع", cancelled: "ملغي",
  pending_approval: "بانتظار الموافقة", suspended: "معلق", archived: "مؤرشف",
};
const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام", youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة", donor: "مانح",
};

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
      const { data } = await supabase.from("donor_contributions").select("donor_id, amount, project_id, projects(title)").gte("created_at", dateFrom).lte("created_at", dateTo);
      const donors = new Set((data ?? []).map((d: any) => d.donor_id));
      const totalGrants = (data ?? []).reduce((s, d: any) => s + Number(d.amount), 0);
      const byProject: Record<string, number> = {};
      (data ?? []).forEach((d: any) => {
        const name = (d.projects as any)?.title || "خدمة";
        byProject[name] = (byProject[name] || 0) + Number(d.amount);
      });
      return {
        totalDonors: donors.size,
        totalGrants,
        byProject: Object.entries(byProject).map(([name, amount]) => ({ name, amount })),
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

  const exportPDF = async () => {
    try {
      const sections = [];

      if (projectsByStatus?.length) {
        sections.push({
          title: "Projects by Status",
          headers: ["Status", "Count"],
          rows: projectsByStatus.map((p) => [p.name, String(p.value)]),
        });
      }
      if (projectsByRegion?.length) {
        sections.push({
          title: "Projects by Region",
          headers: ["Region", "Count"],
          rows: projectsByRegion.map((p) => [p.name, String(p.value)]),
        });
      }
      if (monthlyDonations?.length) {
        sections.push({
          title: "Monthly Donations",
          headers: ["Month", "Amount (SAR)"],
          rows: monthlyDonations.map((d) => [d.month, String(d.amount)]),
        });
      }
      if (monthlyEscrow?.length) {
        sections.push({
          title: "Monthly Escrow Transactions",
          headers: ["Month", "Total (SAR)", "Released (SAR)"],
          rows: monthlyEscrow.map((e) => [e.month, String(e.total), String(e.released)]),
        });
      }

      generateReportPDF(
        "Platform Analytics Report",
        { from: filters.dateFrom, to: filters.dateTo },
        sections,
        [
          { label: "Users", value: String(stats?.totalUsers ?? 0) },
          { label: "Projects", value: String(stats?.totalProjects ?? 0) },
          { label: "Revenue (SAR)", value: (stats?.revenue ?? 0).toLocaleString() },
          { label: "Open Disputes", value: String(stats?.openDisputes ?? 0) },
        ]
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
            <Button variant="outline" onClick={exportPDF} className="gap-1">
              <FileText className="h-4 w-4" />تصدير PDF
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 ml-2" />CSV<ChevronDown className="h-4 w-4 mr-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportUsers}>تصدير المستخدمين</DropdownMenuItem>
                <DropdownMenuItem onClick={exportProjects}>تصدير المشاريع</DropdownMenuItem>
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
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">المشاريع</p><p className="text-2xl font-bold">{stats?.totalProjects ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">النزاعات المفتوحة</p><p className="text-2xl font-bold">{stats?.openDisputes ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">الإيرادات</p><p className="text-2xl font-bold">{(stats?.revenue ?? 0).toLocaleString()} ر.س</p></CardContent></Card>
        </div>

        {/* Period Comparison */}
        <PeriodComparison dateFrom={filters.dateFrom} dateTo={filters.dateTo} regionId={filters.regionId} />

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">المشاريع حسب الحالة</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={projectsByStatus ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {(projectsByStatus ?? []).map((_: any, i: number) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">المستخدمين حسب الدور</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={usersByRole ?? []}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))">
                    {(usersByRole ?? []).map((_: any, i: number) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">الخدمات حسب التصنيف</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={servicesByCategory ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {(servicesByCategory ?? []).map((_: any, i: number) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">المشاريع حسب المنطقة</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={projectsByRegion ?? []}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">التبرعات الشهرية</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyDonations ?? []}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis />
                  <Tooltip /><Bar dataKey="amount" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">حالة الخدمات</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={serviceApprovalStats ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {(serviceApprovalStats ?? []).map((_: any, i: number) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">المعاملات المالية الشهرية</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyEscrow ?? []}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="إجمالي" />
                  <Bar dataKey="released" fill="#10b981" name="محرّر" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">توزيع أسعار الساعة</CardTitle></CardHeader>
            <CardContent>
              {hourlyRateData?.avg ? (
                <>
                  <p className="text-sm text-muted-foreground mb-3">المتوسط: <span className="font-bold text-foreground">{hourlyRateData.avg.toFixed(0)} ر.س/ساعة</span></p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hourlyRateData.distribution}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="range" /><YAxis />
                      <Tooltip /><Bar dataKey="count" fill="#6366f1" name="عدد" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">تحليلات المانحين</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">عدد المانحين</p>
                <p className="text-2xl font-bold">{donorAnalytics?.totalDonors ?? 0}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">إجمالي التبرعات</p>
                <p className="text-2xl font-bold">{(donorAnalytics?.totalGrants ?? 0).toLocaleString()} ر.س</p>
              </div>
            </div>
            {donorAnalytics?.byProject?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={donorAnalytics.byProject}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                  <Tooltip /><Bar dataKey="amount" fill="hsl(var(--accent))" name="المبلغ" />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
