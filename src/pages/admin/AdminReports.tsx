import { DashboardLayout } from "@/components/DashboardLayout";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { Download } from "lucide-react";

const STATUS_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#ef4444", "#6b7280"];
const ROLE_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#6366f1"];

export default function AdminReports() {
  const { data: stats } = useAdminStats();

  const { data: projectsByStatus } = useQuery({
    queryKey: ["admin-report-projects-status"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("status");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: any) => { counts[p.status] = (counts[p.status] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name: statusLabels[name] || name, value }));
    },
  });

  const { data: usersByRole } = useQuery({
    queryKey: ["admin-report-users-role"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { counts[r.role] = (counts[r.role] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name: roleLabels[name] || name, value }));
    },
  });

  const { data: monthlyDonations } = useQuery({
    queryKey: ["admin-report-donations"],
    queryFn: async () => {
      const { data } = await supabase.from("donor_contributions").select("amount, created_at");
      const months: Record<string, number> = {};
      (data ?? []).forEach((d: any) => {
        const key = format(startOfMonth(parseISO(d.created_at)), "yyyy-MM");
        months[key] = (months[key] || 0) + Number(d.amount);
      });
      return Object.entries(months).sort().slice(-12).map(([month, amount]) => ({ month, amount }));
    },
  });

  const exportCSV = async () => {
    const { data: users } = await supabase.from("profiles").select("full_name, phone, organization_name, is_verified, created_at");
    const headers = ["الاسم", "الهاتف", "المنظمة", "موثق", "تاريخ الانضمام"];
    const rows = (users ?? []).map((u: any) => [u.full_name, u.phone ?? "", u.organization_name ?? "", u.is_verified ? "نعم" : "لا", u.created_at?.slice(0, 10)]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">التقارير</h1>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">المستخدمين</p><p className="text-2xl font-bold">{stats?.totalUsers ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">المشاريع</p><p className="text-2xl font-bold">{stats?.totalProjects ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">النزاعات المفتوحة</p><p className="text-2xl font-bold">{stats?.openDisputes ?? 0}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">الإيرادات</p><p className="text-2xl font-bold">{(stats?.revenue ?? 0).toLocaleString()} ر.س</p></CardContent></Card>
        </div>

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
      </div>
    </DashboardLayout>
  );
}

const statusLabels: Record<string, string> = {
  draft: "مسودة", open: "مفتوح", in_progress: "قيد التنفيذ",
  completed: "مكتمل", disputed: "متنازع", cancelled: "ملغي",
};
const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام", youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة", donor: "مانح",
};
