import { useState, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { Download, ChevronDown, FileText, Printer, Package, CheckCircle2, FileSignature, Shield, HeartHandshake, LifeBuoy } from "lucide-react";
import { ReportFilters, getDefaultFilters, type ReportFilterValues } from "@/components/admin/ReportFilters";
import { generateReportFromDOM } from "@/lib/report-pdf";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/csv-export";

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

/* ─── Top N + Others helper ─── */
function topNWithOthers(data: { name: string; value: number }[], n = 5) {
  if (data.length <= n) return data;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, n);
  const othersValue = sorted.slice(n).reduce((s, d) => s + d.value, 0);
  if (othersValue > 0) top.push({ name: "أخرى", value: othersValue });
  return top;
}

function topNWithOthersAmount(data: { name: string; amount: number }[], n = 5) {
  if (data.length <= n) return data;
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, n);
  const othersAmount = sorted.slice(n).reduce((s, d) => s + d.amount, 0);
  if (othersAmount > 0) top.push({ name: "أخرى", amount: othersAmount });
  return top;
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
          <span className="text-muted-foreground">{(entry.name === "value" ? "القيمة" : entry.name) ?? entry.dataKey}:</span>
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

export default function AdminReports() {
  const [filters, setFilters] = useState<ReportFilterValues>(getDefaultFilters);
  const { data: stats } = useAdminStats();
  const dateFrom = filters.dateFrom.toISOString();
  const dateTo = filters.dateTo.toISOString();
  const regionId = filters.regionId;
  const cityId = filters.cityId;

  // --- Helper: fetch project IDs for selected region/city (used by related tables) ---
  const { data: regionProjectIds } = useQuery({
    queryKey: ["region-project-ids", regionId, cityId],
    queryFn: async () => {
      if (!regionId && !cityId) return null;
      let q = supabase.from("projects").select("id");
      if (regionId) q = q.eq("region_id", regionId);
      if (cityId) q = q.eq("city_id", cityId);
      const { data } = await q;
      return (data ?? []).map((p: any) => p.id);
    },
    enabled: !!regionId || !!cityId,
  });

  // --- Filtered queries ---
  const { data: projectsByStatus } = useQuery({
    queryKey: ["admin-report-projects-status", dateFrom, dateTo, regionId, cityId],
    queryFn: async () => {
      let q = supabase.from("projects").select("status").gte("created_at", dateFrom).lte("created_at", dateTo);
      if (regionId) q = q.eq("region_id", regionId);
      if (cityId) q = q.eq("city_id", cityId);
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
      (data ?? []).filter((r: any) => r.role !== "super_admin").forEach((r: any) => { counts[r.role] = (counts[r.role] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name: roleLabels[name] || name, value }));
    },
  });

  const { data: monthlyDonations } = useQuery({
    queryKey: ["admin-report-donations", dateFrom, dateTo, regionId, cityId, regionProjectIds],
    enabled: !(regionId || cityId) || regionProjectIds !== undefined,
    queryFn: async () => {
      let q = supabase.from("donor_contributions").select("amount, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
      if ((regionId || cityId) && regionProjectIds) {
        if (regionProjectIds.length === 0) return [];
        q = q.in("project_id", regionProjectIds);
      }
      const { data } = await q;
      const months: Record<string, number> = {};
      (data ?? []).forEach((d: any) => {
        const key = format(startOfMonth(parseISO(d.created_at)), "yyyy-MM");
        months[key] = (months[key] || 0) + Number(d.amount);
      });
      return Object.entries(months).sort().map(([month, amount]) => ({ month, amount }));
    },
  });

  const { data: servicesByCategory } = useQuery({
    queryKey: ["admin-report-services-category", dateFrom, dateTo, regionId, cityId],
    queryFn: async () => {
      let q = supabase.from("micro_services").select("category_id, categories(name)").gte("created_at", dateFrom).lte("created_at", dateTo);
      if (regionId) q = q.eq("region_id", regionId);
      if (cityId) q = q.eq("city_id", cityId);
      const { data } = await q;
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
    queryKey: ["admin-report-service-approval", dateFrom, dateTo, regionId, cityId],
    queryFn: async () => {
      let q = supabase.from("micro_services").select("approval").gte("created_at", dateFrom).lte("created_at", dateTo);
      if (regionId) q = q.eq("region_id", regionId);
      if (cityId) q = q.eq("city_id", cityId);
      const { data } = await q;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((s: any) => { counts[s.approval] = (counts[s.approval] || 0) + 1; });
      const labels: Record<string, string> = { pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض" };
      return Object.entries(counts).map(([name, value]) => ({ name: labels[name] || name, value }));
    },
  });

  const { data: monthlyEscrow } = useQuery({
    queryKey: ["admin-report-monthly-escrow", dateFrom, dateTo, regionId, cityId, regionProjectIds],
    enabled: !(regionId || cityId) || regionProjectIds !== undefined,
    queryFn: async () => {
      let q = supabase.from("escrow_transactions").select("amount, status, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
      if ((regionId || cityId) && regionProjectIds) {
        if (regionProjectIds.length === 0) return [];
        q = q.in("project_id", regionProjectIds);
      }
      const { data } = await q;
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
    queryKey: ["admin-report-donor-analytics", dateFrom, dateTo, regionId, cityId, regionProjectIds],
    enabled: !(regionId || cityId) || regionProjectIds !== undefined,
    queryFn: async () => {
      let q = supabase.from("donor_contributions").select("donor_id, amount, project_id, association_id, projects(title), profiles!donor_contributions_donor_id_fkey(full_name, organization_name)").gte("created_at", dateFrom).lte("created_at", dateTo);
      if ((regionId || cityId) && regionProjectIds) {
        if (regionProjectIds.length === 0) return { totalDonors: 0, totalGrants: 0, byProject: [], perDonor: [] };
        q = q.in("project_id", regionProjectIds);
      }
      const { data } = await q;
      const donors = new Set((data ?? []).map((d: any) => d.donor_id));
      const totalGrants = (data ?? []).reduce((s, d: any) => s + Number(d.amount), 0);
      const byProject: Record<string, number> = {};
      (data ?? []).forEach((d: any) => {
        const name = (d.projects as any)?.title || "خدمة";
        byProject[name] = (byProject[name] || 0) + Number(d.amount);
      });
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

  // --- New: Additional Insights ---
  const { data: insights } = useQuery({
    queryKey: ["admin-report-insights", dateFrom, dateTo, regionId, cityId, regionProjectIds],
    enabled: !(regionId || cityId) || regionProjectIds !== undefined,
    queryFn: async () => {
      // Services count
      let sQ = supabase.from("micro_services").select("id", { count: "exact", head: true }).eq("approval", "approved").gte("created_at", dateFrom).lte("created_at", dateTo);
      if (regionId) sQ = sQ.eq("region_id", regionId);
      if (cityId) sQ = sQ.eq("city_id", cityId);
      const { count: servicesCount } = await sQ;

      // Completed projects
      let pQ = supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "completed").gte("created_at", dateFrom).lte("created_at", dateTo);
      if (regionId) pQ = pQ.eq("region_id", regionId);
      if (cityId) pQ = pQ.eq("city_id", cityId);
      const { count: completedProjects } = await pQ;

      // Contracts count
      let cQ = supabase.from("contracts").select("id", { count: "exact", head: true }).gte("created_at", dateFrom).lte("created_at", dateTo);
      if ((regionId || cityId) && regionProjectIds) {
        if (regionProjectIds.length === 0) return { servicesCount: 0, completedProjects: 0, contractsCount: 0, heldEscrow: 0, activeDonors: 0, ticketsCount: 0 };
        cQ = cQ.in("project_id", regionProjectIds);
      }
      const { count: contractsCount } = await cQ;

      // Held escrow sum
      let eQ = supabase.from("escrow_transactions").select("amount").eq("status", "held").gte("created_at", dateFrom).lte("created_at", dateTo);
      if ((regionId || cityId) && regionProjectIds) {
        if (regionProjectIds.length === 0) return { servicesCount: servicesCount ?? 0, completedProjects: completedProjects ?? 0, contractsCount: contractsCount ?? 0, heldEscrow: 0, activeDonors: 0, ticketsCount: 0 };
        eQ = eQ.in("project_id", regionProjectIds);
      }
      const { data: escrowData } = await eQ;
      const heldEscrow = (escrowData ?? []).reduce((s, e: any) => s + Number(e.amount), 0);

      // Active donors
      const { data: donorData } = await supabase.from("donor_contributions").select("donor_id").gte("created_at", dateFrom).lte("created_at", dateTo);
      const activeDonors = new Set((donorData ?? []).map((d: any) => d.donor_id)).size;

      // Support tickets count
      const { count: ticketsCount } = await supabase.from("support_tickets").select("id", { count: "exact", head: true }).gte("created_at", dateFrom).lte("created_at", dateTo);

      return {
        servicesCount: servicesCount ?? 0,
        completedProjects: completedProjects ?? 0,
        contractsCount: contractsCount ?? 0,
        heldEscrow,
        activeDonors,
        ticketsCount: ticketsCount ?? 0,
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
    if (cityId) q = q.eq("city_id", cityId);
    const { data } = await q;
    downloadCSV("projects.csv", ["المعرف", "العنوان", "الحالة", "الميزانية", "المنطقة", "التصنيف", "تاريخ الإنشاء"],
      (data ?? []).map((p: any) => [p.id, p.title, p.status, p.budget ?? "", (p.regions as any)?.name ?? "", (p.categories as any)?.name ?? "", p.created_at?.slice(0, 10)]));
  };
  const exportServices = async () => {
    let q = supabase.from("micro_services").select("title, price, approval, created_at, categories(name), profiles!micro_services_provider_id_fkey(full_name)").gte("created_at", dateFrom).lte("created_at", dateTo);
    if (regionId) q = q.eq("region_id", regionId);
    if (cityId) q = q.eq("city_id", cityId);
    const { data } = await q;
    downloadCSV("services.csv", ["العنوان", "مقدم الخدمة", "السعر", "التصنيف", "الحالة", "تاريخ الإنشاء"],
      (data ?? []).map((s: any) => [s.title, (s.profiles as any)?.full_name ?? "", s.price, (s.categories as any)?.name ?? "", s.approval, s.created_at?.slice(0, 10)]));
  };
  const exportFinancial = async () => {
    let q = supabase.from("escrow_transactions").select("amount, status, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
    if ((regionId || cityId) && regionProjectIds?.length) q = q.in("project_id", regionProjectIds);
    const { data } = await q;
    downloadCSV("financial.csv", ["المبلغ", "الحالة", "تاريخ الإنشاء"],
      (data ?? []).map((e: any) => [e.amount, e.status, e.created_at?.slice(0, 10)]));
  };
  const exportInvoices = async () => {
    let escrowIds: string[] | null = null;
    if ((regionId || cityId) && regionProjectIds?.length) {
      const { data: escrows } = await supabase.from("escrow_transactions").select("id").in("project_id", regionProjectIds);
      escrowIds = (escrows ?? []).map((e: any) => e.id);
    }
    let q = supabase.from("invoices").select("invoice_number, amount, commission_amount, created_at").gte("created_at", dateFrom).lte("created_at", dateTo);
    if (escrowIds !== null) {
      if (escrowIds.length === 0) { downloadCSV("invoices.csv", ["رقم الفاتورة", "المبلغ", "العمولة", "تاريخ الإنشاء"], []); return; }
      q = q.in("escrow_id", escrowIds);
    }
    const { data } = await q;
    downloadCSV("invoices.csv", ["رقم الفاتورة", "المبلغ", "العمولة", "تاريخ الإنشاء"],
      (data ?? []).map((i: any) => [i.invoice_number, i.amount, i.commission_amount, i.created_at?.slice(0, 10)]));
  };

  const exportComprehensive = () => {
    const rows: string[][] = [
      ["المستخدمين", String(stats?.totalUsers ?? 0)],
      ["طلبات الجمعيات", String(stats?.totalProjects ?? 0)],
      ["الشكاوى المفتوحة", String(stats?.openDisputes ?? 0)],
      ["الإيرادات (ر.س)", String(stats?.revenue ?? 0)],
      ["الخدمات المعتمدة", String(insights?.servicesCount ?? 0)],
      ["المشاريع المكتملة", String(insights?.completedProjects ?? 0)],
      ["العقود", String(insights?.contractsCount ?? 0)],
      ["الضمانات المحتجزة (ر.س)", String(insights?.heldEscrow ?? 0)],
      ["المانحين النشطين", String(insights?.activeDonors ?? 0)],
      ["تذاكر الدعم", String(insights?.ticketsCount ?? 0)],
    ];
    downloadCSV("comprehensive-report.csv", ["المؤشر", "القيمة"], rows);
    toast.success("تم تصدير التقرير الشامل");
  };

  // Ref for DOM-based PDF capture
  const reportContentRef = useRef<HTMLDivElement>(null);

  const exportPDF = useCallback(async () => {
    if (!reportContentRef.current) {
      toast.error("لا يوجد محتوى لتصديره");
      return;
    }
    try {
      toast.info("جارٍ إعداد التقرير...");
      await generateReportFromDOM(reportContentRef.current, "تقرير-تحليلات-المنصة");
      toast.success("تم تصدير التقرير بصيغة PDF");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("حدث خطأ أثناء تصدير PDF");
    }
  }, []);

  // Prepared chart data with topN
  const chartServicesByCategory = topNWithOthers(servicesByCategory ?? []);
  const chartProjectsByRegion = topNWithOthers(projectsByRegion ?? []);
  const chartDonorByProject = topNWithOthersAmount(donorAnalytics?.byProject ?? []);
  const chartPerDonor = topNWithOthersAmount(donorAnalytics?.perDonor ?? []);

  const insightCards = [
    { label: "الخدمات المعتمدة", value: insights?.servicesCount ?? 0, icon: Package, color: "text-blue-600 bg-blue-100" },
    { label: "المشاريع المكتملة", value: insights?.completedProjects ?? 0, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100" },
    { label: "العقود", value: insights?.contractsCount ?? 0, icon: FileSignature, color: "text-violet-600 bg-violet-100" },
    { label: "الضمانات المحتجزة", value: `${(insights?.heldEscrow ?? 0).toLocaleString()} ر.س`, icon: Shield, color: "text-amber-600 bg-amber-100" },
    { label: "المانحين النشطين", value: insights?.activeDonors ?? 0, icon: HeartHandshake, color: "text-rose-600 bg-rose-100" },
    { label: "تذاكر الدعم", value: insights?.ticketsCount ?? 0, icon: LifeBuoy, color: "text-cyan-600 bg-cyan-100" },
  ];

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
                <DropdownMenuItem onClick={exportComprehensive} className="font-semibold">تصدير التقرير الشامل</DropdownMenuItem>
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

        {/* Report content area - captured for PDF */}
        <div ref={reportContentRef} className="space-y-6">
        {/* Summary stats - Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">المستخدمين</p><p className="text-2xl font-bold">{stats?.totalUsers ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">طلبات الجمعيات</p><p className="text-2xl font-bold">{stats?.totalProjects ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">الشكاوى المفتوحة</p><p className="text-2xl font-bold">{stats?.openDisputes ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">الإيرادات</p><p className="text-2xl font-bold">{(stats?.revenue ?? 0).toLocaleString()} ر.س</p></CardContent></Card>
        </div>

        {/* Summary stats - Row 2: New Insights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {insightCards.map((card) => (
            <Card key={card.label} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4 flex flex-col items-center text-center gap-2">
                <div className={`rounded-full p-2 ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold">{typeof card.value === "number" ? card.value.toLocaleString() : card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══════════ Charts ═══════════ */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie: الطلبات حسب الحالة */}
          <Card e className="text-lg text-center">الطلبات حسب الحالة</CardTitle></CardHeader>
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
          <Card ref={setChartRef(2, "المستخدمين حسب الدورe className="text-lg text-center">المستخدمين حسب الدور</CardTitle></CardHeader>
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
          {/* Pie: الخدمات حسب التصنيف (Top 5 + أخرى) */}
          <Card ref={setChartRef(3, "الخدمات حسب التصنيف")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">الخدمات حسب التصنيف</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chartServicesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} cornerRadius={4} label={renderPieLabel} labelLine={false} animationDuration={800} animationEasing="ease-out">
                    {chartServicesByCategory.map((_: any, i: number) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar: الطلبات حسب المنطقة (Top 5 + أخرى) */}
          <Card ref={setChartRef(4, "الطلبات حسب المنطقة")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">الطلبات حسب المنطقة</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartProjectsByRegion} margin={{ top: 20 }}>
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
            {chartDonorByProject.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartDonorByProject} margin={{ top: 20 }}>
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

        {/* Per-Donor Contributions Chart (Top 5 + أخرى) */}
        {chartPerDonor.length ? (
          <Card ref={setChartRef(9, "مساهمات المانحين")} className={chartCardCls}>
            <CardHeader><CardTitle className="text-lg text-center">مساهمات المانحين والرعاة</CardTitle></CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartPerDonor} barGap={8} margin={{ top: 20 }}>
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
        </div>{/* end reportContentRef */}
      </div>
    </DashboardLayout>
  );
}
