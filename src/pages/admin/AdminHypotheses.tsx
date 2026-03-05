import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useHypotheses, useUpdateHypothesis } from "@/hooks/useHypotheses";
import { useHypothesisMetrics } from "@/hooks/useHypothesisMetrics";
import { HypothesisMetricsPanel } from "@/components/admin/HypothesisMetricsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  FlaskConical, CheckCircle2, XCircle, Clock, ChevronDown,
  Target, TestTube, Award, Users, Building2, Briefcase, Shield, Gauge,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  not_tested: { label: "لم تُختبر", color: "bg-muted text-muted-foreground", icon: Clock },
  testing: { label: "قيد الاختبار", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: FlaskConical },
  verified: { label: "تم التحقق", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  not_verified: { label: "لم تتحقق", color: "bg-destructive/15 text-destructive", icon: XCircle },
};

const DOMAIN_CONFIG: Record<string, { label: string; icon: typeof Users }> = {
  "مزوّدي الخدمات": { label: "مزوّدي الخدمات", icon: Users },
  "الجمعيات": { label: "الجمعيات", icon: Building2 },
  "نموذج العمل": { label: "نموذج العمل", icon: Briefcase },
  "التشغيل والحوكمة": { label: "التشغيل والحوكمة", icon: Shield },
};

// Hypotheses that have automated metrics
const AUTOMATED_HYPOTHESES = new Set([1, 2, 3, 5, 7, 8, 9, 10, 11, 12, 14, 15, 17, 18, 23, 24, 25]);

function AdminHypotheses() {
  const { data: hypotheses, isLoading } = useHypotheses();
  const { data: metrics } = useHypothesisMetrics();
  const updateMutation = useUpdateHypothesis();

  const handleUpdate = (id: number, field: string, value: string) => {
    updateMutation.mutate(
      { id, [field]: value },
      { onSuccess: () => toast.success("تم التحديث") }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const all = hypotheses ?? [];
  const counts = {
    verified: all.filter((h) => h.status === "verified").length,
    testing: all.filter((h) => h.status === "testing").length,
    not_tested: all.filter((h) => h.status === "not_tested").length,
    not_verified: all.filter((h) => h.status === "not_verified").length,
  };
  const progressPct = all.length > 0 ? Math.round(((counts.verified + counts.not_verified) / all.length) * 100) : 0;
  const domains = Object.keys(DOMAIN_CONFIG);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الفرضيات</h1>
            <p className="text-sm text-muted-foreground">تتبع فرضيات نجاح النظام — المؤشرات تُحسب آلياً من بيانات النظام</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPICard icon={Gauge} label="التقدم الكلي" value={`${progressPct}%`} sub={`${counts.verified + counts.not_verified} من ${all.length}`} color="text-primary" />
          <KPICard icon={CheckCircle2} label="تم التحقق" value={counts.verified} color="text-emerald-600" />
          <KPICard icon={FlaskConical} label="قيد الاختبار" value={counts.testing} color="text-amber-600" />
          <KPICard icon={Clock} label="لم تُختبر" value={counts.not_tested} color="text-muted-foreground" />
          <KPICard icon={XCircle} label="لم تتحقق" value={counts.not_verified} color="text-destructive" />
        </div>

        {/* Overall progress */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">نسبة الفرضيات المُختبرة</span>
              <span className="text-sm font-bold text-primary">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2.5" />
          </CardContent>
        </Card>

        {/* Domain Tabs */}
        <Tabs defaultValue={domains[0]} dir="rtl">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {domains.map((d) => {
              const DIcon = DOMAIN_CONFIG[d].icon;
              const count = all.filter((h) => h.domain === d).length;
              return (
                <TabsTrigger key={d} value={d} className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <DIcon className="h-3.5 w-3.5" />
                  {DOMAIN_CONFIG[d].label}
                  <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">{count}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {domains.map((d) => (
            <TabsContent key={d} value={d} className="mt-4 space-y-4">
              {all
                .filter((h) => h.domain === d)
                .map((h) => (
                  <HypothesisCard
                    key={h.id}
                    hypothesis={h}
                    metrics={metrics}
                    isAutomated={AUTOMATED_HYPOTHESES.has(h.hypothesis_number)}
                    onUpdate={handleUpdate}
                  />
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function KPICard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: any; sub?: string; color: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col items-center text-center gap-1">
        <Icon className={`h-6 w-6 ${color}`} />
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        {sub && <span className="text-[10px] text-muted-foreground/70">{sub}</span>}
      </CardContent>
    </Card>
  );
}

function HypothesisCard({
  hypothesis: h,
  metrics,
  isAutomated,
  onUpdate,
}: {
  hypothesis: any;
  metrics: any;
  isAutomated: boolean;
  onUpdate: (id: number, field: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const statusInfo = STATUS_MAP[h.status] || STATUS_MAP.not_tested;
  const StatusIcon = statusInfo.icon;

  const progressValue =
    h.status === "verified" ? 100 : h.status === "not_verified" ? 100 : h.status === "testing" ? 50 : 0;
  const progressColor =
    h.status === "verified"
      ? "[&>div]:bg-emerald-500"
      : h.status === "not_verified"
      ? "[&>div]:bg-destructive"
      : h.status === "testing"
      ? "[&>div]:bg-amber-500"
      : "[&>div]:bg-muted-foreground/30";

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
              {h.hypothesis_number}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm leading-relaxed">{h.hypothesis}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={progressValue} className={`h-1.5 w-32 ${progressColor}`} />
                {isAutomated && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/30 text-primary">آلي</Badge>
                )}
              </div>
            </div>
          </div>
          <Badge className={`shrink-0 ${statusInfo.color} border-0 gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Automated Metrics Panel */}
        {isAutomated && (
          <HypothesisMetricsPanel hypothesisNumber={h.hypothesis_number} metrics={metrics} />
        )}

        {/* Collapsible details */}
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            تفاصيل الفرضية
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <DetailRow icon={Target} label="ماذا نقيس" value={h.metric} />
            <DetailRow icon={TestTube} label="طريقة الاختبار" value={h.test_method} />
            <DetailRow icon={Award} label="معيار النجاح" value={h.success_criteria} />
          </CollapsibleContent>
        </Collapsible>

        {/* Admin controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">الحالة</label>
            <Select value={h.status} onValueChange={(v) => onUpdate(h.id, "status", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">ملاحظات</label>
            <Textarea
              className="min-h-8 h-8 text-xs resize-none"
              defaultValue={h.admin_notes}
              placeholder="ملاحظات..."
              onBlur={(e) => {
                if (e.target.value !== h.admin_notes) onUpdate(h.id, "admin_notes", e.target.value);
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-[10px] text-muted-foreground block">{label}</span>
        <span className="text-xs leading-relaxed">{value}</span>
      </div>
    </div>
  );
}

export default AdminHypotheses;
