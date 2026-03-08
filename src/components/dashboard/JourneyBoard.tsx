import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowLeft } from "lucide-react";

interface Step {
  label: string;
  count: number | string;
  done: boolean;
}

function StepPipeline({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1 shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
            step.done
              ? "bg-success/10 text-success border-success/20"
              : (typeof step.count === "number" ? step.count > 0 : step.count !== "0")
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border"
          }`}>
            {step.done ? <CheckCircle className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            {step.label}
            {step.count !== 0 && step.count !== "0" && <Badge variant="secondary" className="text-[10px] px-1 h-4">{step.count}</Badge>}
          </div>
          {i < steps.length - 1 && <ArrowLeft className="h-3 w-3 text-muted-foreground shrink-0 rtl:-scale-x-100" />}
        </div>
      ))}
    </div>
  );
}

function AssociationJourney() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["journey-association", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [projects, bids, contracts, completed, grants] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("association_id", user!.id),
        supabase.from("bids").select("id", { count: "exact", head: true }).in("project_id",
          (await supabase.from("projects").select("id").eq("association_id", user!.id)).data?.map((p: any) => p.id) || []
        ),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("association_id", user!.id),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("association_id", user!.id).eq("status", "completed"),
        supabase.from("donor_contributions").select("amount").eq("association_id", user!.id).eq("donation_status", "available"),
      ]);
      const grantBalance = (grants.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      return {
        projects: projects.count ?? 0,
        bids: bids.count ?? 0,
        contracts: contracts.count ?? 0,
        completed: completed.count ?? 0,
        grantBalance,
      };
    },
  });

  const formattedGrants = `${(data?.grantBalance ?? 0).toLocaleString()} ر.س`;

  const steps: Step[] = [
    { label: "مشاريع مقدمة", count: data?.projects ?? 0, done: (data?.projects ?? 0) > 0 },
    { label: "عروض مستلمة", count: data?.bids ?? 0, done: (data?.bids ?? 0) > 0 },
    { label: "عقود", count: data?.contracts ?? 0, done: (data?.contracts ?? 0) > 0 },
    { label: "منح متاحة", count: formattedGrants, done: (data?.grantBalance ?? 0) > 0 },
    { label: "مكتملة", count: data?.completed ?? 0, done: (data?.completed ?? 0) > 0 },
  ];

  return <StepPipeline steps={steps} />;
}

function ProviderJourney() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["journey-provider", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [bids, contracts, timeLogs, earnings] = await Promise.all([
        supabase.from("bids").select("id", { count: "exact", head: true }).eq("provider_id", user!.id),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("provider_id", user!.id),
        supabase.from("time_logs").select("id", { count: "exact", head: true }).eq("provider_id", user!.id),
        supabase.from("escrow_transactions").select("amount").eq("payee_id", user!.id).eq("status", "released"),
      ]);
      const totalEarnings = (earnings.data ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0);
      return {
        bids: bids.count ?? 0,
        contracts: contracts.count ?? 0,
        timeLogs: timeLogs.count ?? 0,
        earnings: totalEarnings,
      };
    },
  });

  const formattedEarnings = `${(data?.earnings ?? 0).toLocaleString()} ر.س`;

  const steps: Step[] = [
    { label: "عروض مقدمة", count: data?.bids ?? 0, done: (data?.bids ?? 0) > 0 },
    { label: "عقود", count: data?.contracts ?? 0, done: (data?.contracts ?? 0) > 0 },
    { label: "ساعات عمل", count: data?.timeLogs ?? 0, done: (data?.timeLogs ?? 0) > 0 },
    { label: "أرباح", count: formattedEarnings, done: (data?.earnings ?? 0) > 0 },
  ];

  return <StepPipeline steps={steps} />;
}

function DonorJourney() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["journey-donor", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [donations, allocated] = await Promise.all([
        supabase.from("donor_contributions").select("id, amount", { count: "exact" }).eq("donor_id", user!.id),
        supabase.from("donor_contributions").select("id", { count: "exact", head: true }).eq("donor_id", user!.id).not("project_id", "is", null),
      ]);
      const totalAmount = (donations.data ?? []).reduce((s: number, d: any) => s + Number(d.amount), 0);
      return {
        donations: donations.count ?? 0,
        totalAmount,
        allocated: allocated.count ?? 0,
      };
    },
  });

  const steps: Step[] = [
    { label: "تبرعات", count: data?.donations ?? 0, done: (data?.donations ?? 0) > 0 },
    { label: "تخصيصات", count: data?.allocated ?? 0, done: (data?.allocated ?? 0) > 0 },
    { label: "أثر", count: 0, done: false },
  ];

  return <StepPipeline steps={steps} />;
}

export function JourneyBoard({ role }: { role: string }) {
  const journeyMap: Record<string, React.ComponentType> = {
    youth_association: AssociationJourney,
    service_provider: ProviderJourney,
    donor: DonorJourney,
  };

  const JourneyComponent = journeyMap[role];
  if (!JourneyComponent) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">مسار العمليات</CardTitle>
      </CardHeader>
      <CardContent>
        <JourneyComponent />
      </CardContent>
    </Card>
  );
}
