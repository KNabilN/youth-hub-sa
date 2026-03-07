import { HypothesisMetrics } from "@/hooks/useHypothesisMetrics";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, Minus, Users, Clock, BarChart3,
  ShieldCheck, Star, Repeat, UserCheck, CreditCard, AlertTriangle,
  FileCheck, Percent,
} from "lucide-react";

interface MetricsPanelProps {
  hypothesisNumber: number;
  metrics: HypothesisMetrics | undefined;
}

function MiniKPI({ label, value, suffix, icon: Icon, color }: {
  label: string; value: string | number | null; suffix?: string;
  icon?: any; color?: string;
}) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/40 min-w-[80px]">
      {Icon && <Icon className={`h-3.5 w-3.5 ${color ?? "text-muted-foreground"}`} />}
      <span className={`text-base font-bold ${color ?? "text-foreground"}`}>
        {value}{suffix}
      </span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function CompareBar({ labelA, labelB, valueA, valueB, suffix = "%" }: {
  labelA: string; labelB: string; valueA: number | null; valueB: number | null; suffix?: string;
}) {
  if (valueA === null || valueB === null) return null;
  const colorA = valueA >= valueB ? "text-emerald-600" : "text-destructive";
  const colorB = valueB >= valueA ? "text-emerald-600" : "text-destructive";
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
      <div className="flex-1 text-center">
        <div className={`text-sm font-bold ${colorA}`}>{valueA}{suffix}</div>
        <div className="text-[10px] text-muted-foreground">{labelA}</div>
      </div>
      <div className="text-muted-foreground text-xs">vs</div>
      <div className="flex-1 text-center">
        <div className={`text-sm font-bold ${colorB}`}>{valueB}{suffix}</div>
        <div className="text-[10px] text-muted-foreground">{labelB}</div>
      </div>
    </div>
  );
}

function ProgressToTarget({ label, current, target, unit = "%" }: {
  label: string; current: number | null; target: number; unit?: string;
}) {
  if (current === null) return null;
  const pct = Math.min(Math.round((current / target) * 100), 100);
  const color = pct >= 80 ? "[&>div]:bg-emerald-500" : pct >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span>{current}{unit} / {target}{unit}</span>
      </div>
      <Progress value={pct} className={`h-1.5 ${color}`} />
    </div>
  );
}

export function HypothesisMetricsPanel({ hypothesisNumber, metrics }: MetricsPanelProps) {
  if (!metrics) return null;

  const panelMap: Record<number, () => React.ReactNode> = {
    1: () => {
      const m = metrics.h1;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="مزودين نشطين (30 يوم)" value={m.activeCount} icon={Users} color="text-primary" />
            <MiniKPI label="% نشاط" value={m.activeProviderPct} suffix="%" icon={TrendingUp} color="text-emerald-600" />
            <MiniKPI label="بقاء 90 يوم" value={m.retentionPct90} suffix="%" icon={Repeat} color="text-amber-600" />
            <MiniKPI label="إجمالي مزودين" value={m.totalProviders} icon={Users} />
          </div>
          <ProgressToTarget label="نشاط المزودين → الهدف 60%" current={m.activeProviderPct} target={60} />
        </div>
      );
    },
    2: () => {
      const m = metrics.h2;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="متوسط ساعات أول عرض" value={m.avgHoursToFirstBid} suffix="h" icon={Clock} color="text-primary" />
            <MiniKPI label="% خلال 48 ساعة" value={m.pctWithin48h} suffix="%" icon={TrendingUp} color="text-emerald-600" />
            <MiniKPI label="مشاريع بعروض" value={m.totalProjectsWithBids} icon={BarChart3} />
          </div>
          <CompareBar labelA="إغلاق (سريع ≤48h)" labelB="إغلاق (بطيء >48h)" valueA={m.closureWithFast} valueB={m.closureWithSlow} />
          <ProgressToTarget label="% استجابة خلال 48h → الهدف 70%" current={m.pctWithin48h} target={70} />
        </div>
      );
    },
    3: () => {
      const m = metrics.h3;
      if (m.monthlyTrend.length === 0) return <p className="text-xs text-muted-foreground">لا توجد بيانات شهرية كافية</p>;
      return (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground mb-1">الاتجاه الشهري (آخر 6 أشهر)</div>
          <div className="grid grid-cols-3 gap-1 text-[10px] font-medium text-muted-foreground border-b pb-1">
            <span>الشهر</span><span>مزودين</span><span>متوسط ساعات</span>
          </div>
          {m.monthlyTrend.map((row) => (
            <div key={row.month} className="grid grid-cols-3 gap-1 text-xs">
              <span className="text-muted-foreground">{row.month}</span>
              <span className="font-medium">{row.activeProviders}</span>
              <span className="font-medium">{row.avgFirstBidHours ?? "-"}h</span>
            </div>
          ))}
        </div>
      );
    },
    5: () => {
      const m = metrics.h5;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="مزودين بباقات" value={m.providersWithPackages} icon={FileCheck} color="text-primary" />
            <MiniKPI label="% من الإجمالي" value={m.pct} suffix="%" icon={Percent} color="text-emerald-600" />
          </div>
          <ProgressToTarget label="% مزودين بباقات → الهدف 30%" current={m.pct} target={30} />
        </div>
      );
    },
    7: () => {
      const m = metrics.h7;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="% تقييم ≥4/5" value={m.ratingPct} suffix="%" icon={Star} color="text-emerald-600" />
            <MiniKPI label="% شكاوى" value={m.complaintsPct} suffix="%" icon={AlertTriangle} color="text-destructive" />
            <MiniKPI label="إجمالي التقييمات" value={m.totalRatings} icon={BarChart3} />
          </div>
          <ProgressToTarget label="% تقييم 4/5+ → الهدف 80%" current={m.ratingPct} target={80} />
        </div>
      );
    },
    8: () => {
      const m = metrics.h8;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="% بلا شكوى" value={m.noDisputePct} suffix="%" icon={ShieldCheck} color="text-emerald-600" />
            <MiniKPI label="متوسط أيام الحل" value={m.avgResolutionDays} suffix=" يوم" icon={Clock} color="text-primary" />
            <MiniKPI label="% حُلت ≤7 أيام" value={m.pctResolvedIn7} suffix="%" icon={TrendingUp} color="text-amber-600" />
          </div>
          <ProgressToTarget label="% بلا شكوى → الهدف 90%" current={m.noDisputePct} target={90} />
        </div>
      );
    },
    9: () => {
      const m = metrics.h9;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="متوسط تقييم الوقت" value={m.avgTimingScore} suffix="/5" icon={Clock} color="text-primary" />
            <MiniKPI label="% إعادة شراء" value={m.repeatPurchasePct} suffix="%" icon={Repeat} color="text-emerald-600" />
            <MiniKPI label="جمعيات مكررة" value={m.repeatAssociations} icon={Users} />
          </div>
          <ProgressToTarget label="% إعادة شراء → الهدف 40%" current={m.repeatPurchasePct} target={40} />
        </div>
      );
    },
    10: () => {
      const m = metrics.h10;
      const isPositive = m.closureCorrelation.includes("إيجابي");
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="متوسط ساعات أول عرض" value={m.avgHoursToFirstBid} suffix="h" icon={Clock} color="text-primary" />
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            {isPositive ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <Minus className="h-4 w-4 text-muted-foreground" />}
            <span className="text-xs">ارتباط سرعة الاستجابة بالإغلاق: <strong>{m.closureCorrelation}</strong></span>
          </div>
        </div>
      );
    },
    11: () => {
      const m = metrics.h11;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="طلبات/90 يوم" value={m.avgRequestsPer90Days} icon={Repeat} color="text-primary" />
            <MiniKPI label="جمعيات نشطة" value={m.activeAssociations} icon={Users} color="text-emerald-600" />
            <MiniKPI label="جمعيات مكررة" value={m.repeatAssociations} icon={UserCheck} color="text-amber-600" />
          </div>
          <ProgressToTarget label="متوسط الطلبات/90 يوم → الهدف 2" current={m.avgRequestsPer90Days} target={2} unit="" />
        </div>
      );
    },
    12: () => {
      const m = metrics.h12;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="% تحول لأول طلب" value={m.conversionPct} suffix="%" icon={TrendingUp} color="text-emerald-600" />
            <MiniKPI label="متوسط أيام التحول" value={m.avgDaysToFirstProject} suffix=" يوم" icon={Clock} color="text-primary" />
            <MiniKPI label="تحولت" value={m.convertedAssociations} icon={UserCheck} />
            <MiniKPI label="إجمالي جمعيات" value={m.totalAssociations} icon={Users} />
          </div>
          <ProgressToTarget label="% تحول → الهدف 50%" current={m.conversionPct} target={50} />
        </div>
      );
    },
    14: () => {
      const m = metrics.h14;
      return (
        <div className="space-y-2">
          <CompareBar labelA={`ثابت (${m.fixedCount})`} labelB={`باقات (${m.packageCount})`} valueA={m.fixedAvgValue} valueB={m.packageAvgValue} suffix=" ر.س" />
        </div>
      );
    },
    15: () => {
      const m = metrics.h15;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="% عروض مرفوضة" value={m.rejectionPct} suffix="%" icon={TrendingDown} color="text-destructive" />
            <MiniKPI label="متوسط ساعات القرار" value={m.avgDecisionHours} suffix="h" icon={Clock} color="text-primary" />
            <MiniKPI label="إجمالي العروض" value={m.totalBids} icon={BarChart3} />
          </div>
        </div>
      );
    },
    17: () => {
      const m = metrics.h17;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="% إعادة شراء (120 يوم)" value={m.repeatPurchasePct120} suffix="%" icon={Repeat} color="text-emerald-600" />
            <MiniKPI label="تذاكر/مشروع" value={m.avgTicketsPerProject} icon={AlertTriangle} color="text-amber-600" />
          </div>
          <ProgressToTarget label="% إعادة شراء → الهدف 30%" current={m.repeatPurchasePct120} target={30} />
        </div>
      );
    },
    18: () => {
      const m = metrics.h18;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="% دفع ذاتي" value={m.selfPayPct} suffix="%" icon={CreditCard} color="text-emerald-600" />
            <MiniKPI label="ذاتي" value={m.selfPayCount} icon={UserCheck} color="text-primary" />
            <MiniKPI label="إجمالي ضمانات" value={m.totalEscrow} icon={BarChart3} />
          </div>
          {m.monthlyTrend.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">اتجاه الدفع الذاتي الشهري</div>
              <div className="flex gap-1">
                {m.monthlyTrend.map((t) => (
                  <div key={t.month} className="flex-1 text-center">
                    <div className="text-[10px] font-bold text-primary">{t.selfPct}%</div>
                    <div className="text-[8px] text-muted-foreground">{t.month.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    },
    23: () => {
      const m = metrics.h23;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="متوسط أيام الحل" value={m.avgResolutionDays} suffix=" يوم" icon={Clock} color="text-primary" />
            <MiniKPI label="% حُلت ≤7 أيام" value={m.pctIn7Days} suffix="%" icon={ShieldCheck} color="text-emerald-600" />
            <MiniKPI label="شكاوى محلولة" value={m.totalResolved} icon={BarChart3} />
          </div>
          <ProgressToTarget label="% حل ≤7 أيام → الهدف 80%" current={m.pctIn7Days} target={80} />
        </div>
      );
    },
    24: () => {
      const m = metrics.h24;
      return (
        <div className="space-y-2">
          <CompareBar labelA={`إغلاق مع ضمان (${m.projectsWithEscrow})`} labelB={`إغلاق بدون (${m.projectsWithout})`} valueA={m.closureWithEscrow} valueB={m.closureWithout} />
          <CompareBar labelA="شكاوى مع ضمان" labelB="شكاوى بدون" valueA={m.disputesWithEscrowPct} valueB={m.disputesWithoutPct} />
        </div>
      );
    },
    25: () => {
      const m = metrics.h25;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <MiniKPI label="% اكتمال متوسط" value={m.avgCompleteness} suffix="%" icon={FileCheck} color="text-primary" />
            <MiniKPI label="مكتملة ≥90%" value={m.fullyComplete} icon={UserCheck} color="text-emerald-600" />
            <MiniKPI label="إجمالي ملفات" value={m.totalProfiles} icon={Users} />
          </div>
          <ProgressToTarget label="% اكتمال → الهدف 70%" current={m.avgCompleteness} target={70} />
        </div>
      );
    },
  };

  const renderer = panelMap[hypothesisNumber];
  if (!renderer) return null;

  return (
    <div className="mt-2 p-3 rounded-xl border border-primary/10 bg-primary/[0.02] space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary">
        <BarChart3 className="h-3 w-3" />
        مؤشرات آلية من النظام
      </div>
      {renderer()}
    </div>
  );
}
