import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useProviderStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["provider-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      const [servicesRes, bidsRes, timeLogsRes, earningsRes, activeProjectsRes, pendingWithdrawalsRes] = await Promise.all([
        supabase.from("micro_services").select("id", { count: "exact", head: true }).eq("provider_id", user!.id),
        supabase.from("bids").select("id", { count: "exact", head: true }).eq("provider_id", user!.id).eq("status", "pending"),
        supabase.from("time_logs").select("hours").eq("provider_id", user!.id).gte("log_date", monthStart),
        supabase.from("escrow_transactions").select("amount").eq("payee_id", user!.id).eq("status", "released"),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("assigned_provider_id", user!.id).eq("status", "in_progress"),
        supabase.from("withdrawal_requests").select("amount").eq("provider_id", user!.id).eq("status", "pending"),
      ]);

      const hoursThisMonth = timeLogsRes.data?.reduce((sum, t) => sum + Number(t.hours), 0) ?? 0;
      const totalEarnings = earningsRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
      const pendingWithdrawals = pendingWithdrawalsRes.data?.reduce((sum, w) => sum + Number(w.amount), 0) ?? 0;

      return {
        servicesCount: servicesRes.count ?? 0,
        activeBids: bidsRes.count ?? 0,
        hoursThisMonth,
        totalEarnings,
        activeProjects: activeProjectsRes.count ?? 0,
        pendingWithdrawals,
      };
    },
  });
}
