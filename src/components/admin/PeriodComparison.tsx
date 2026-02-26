import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus, GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils";
import { subDays, differenceInDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  dateFrom: Date;
  dateTo: Date;
  regionId: string | null;
}

interface MetricComparison {
  label: string;
  current: number;
  previous: number;
  isCurrency?: boolean;
}

function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const pct = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const isUp = pct >= 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-sm font-semibold", isUp ? "text-success" : "text-destructive")}>
      {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
      {Math.abs(pct)}%
    </span>
  );
}

export function PeriodComparison({ dateFrom, dateTo, regionId }: Props) {
  const days = differenceInDays(dateTo, dateFrom) || 1;
  const prevFrom = subDays(dateFrom, days);
  const prevTo = subDays(dateTo, days);

  const currentRange = { from: dateFrom.toISOString(), to: dateTo.toISOString() };
  const prevRange = { from: prevFrom.toISOString(), to: prevTo.toISOString() };

  const { data, isLoading } = useQuery({
    queryKey: ["period-comparison", currentRange, prevRange, regionId],
    queryFn: async () => {
      const fetchPeriod = async (from: string, to: string) => {
        const regionFilter = regionId;

        let projectsQ = supabase.from("projects").select("id", { count: "exact", head: true })
          .gte("created_at", from).lte("created_at", to);
        if (regionFilter) projectsQ = projectsQ.eq("region_id", regionFilter);

        let usersQ = supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("created_at", from).lte("created_at", to);

        let donationsQ = supabase.from("donor_contributions").select("amount")
          .gte("created_at", from).lte("created_at", to);

        let escrowQ = supabase.from("escrow_transactions").select("amount")
          .gte("created_at", from).lte("created_at", to);

        let disputesQ = supabase.from("disputes").select("id", { count: "exact", head: true })
          .gte("created_at", from).lte("created_at", to);

        const [projects, users, donations, escrow, disputes] = await Promise.all([
          projectsQ, usersQ, donationsQ, escrowQ, disputesQ,
        ]);

        return {
          projects: projects.count ?? 0,
          users: users.count ?? 0,
          donations: (donations.data ?? []).reduce((s, d) => s + Number(d.amount), 0),
          escrow: (escrow.data ?? []).reduce((s, e) => s + Number(e.amount), 0),
          disputes: disputes.count ?? 0,
        };
      };

      const [current, previous] = await Promise.all([
        fetchPeriod(currentRange.from, currentRange.to),
        fetchPeriod(prevRange.from, prevRange.to),
      ]);

      return { current, previous };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">مقارنة الفترات</CardTitle></CardHeader>
        <CardContent><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}</div></CardContent>
      </Card>
    );
  }

  const metrics: MetricComparison[] = [
    { label: "المستخدمون الجدد", current: data?.current.users ?? 0, previous: data?.previous.users ?? 0 },
    { label: "الطلبات", current: data?.current.projects ?? 0, previous: data?.previous.projects ?? 0 },
    { label: "المنح", current: data?.current.donations ?? 0, previous: data?.previous.donations ?? 0, isCurrency: true },
    { label: "معاملات الضمان", current: data?.current.escrow ?? 0, previous: data?.previous.escrow ?? 0, isCurrency: true },
    { label: "الشكاوى", current: data?.current.disputes ?? 0, previous: data?.previous.disputes ?? 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GitCompareArrows className="h-5 w-5 text-primary" />
          مقارنة الفترات
        </CardTitle>
        <p className="text-xs text-muted-foreground">مقارنة الفترة المحددة مع الفترة السابقة المماثلة ({days} يوم)</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-muted/40 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">
                  {m.isCurrency ? `${m.current.toLocaleString()} ر.س` : m.current}
                </p>
                <ChangeIndicator current={m.current} previous={m.previous} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                السابقة: {m.isCurrency ? `${m.previous.toLocaleString()} ر.س` : m.previous}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
