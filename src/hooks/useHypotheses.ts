import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Hypothesis {
  id: number;
  hypothesis_number: number;
  domain: string;
  hypothesis: string;
  metric: string;
  test_method: string;
  success_criteria: string;
  status: string;
  actual_value: string;
  admin_notes: string;
  updated_at: string;
  updated_by: string | null;
}

export function useHypotheses() {
  return useQuery({
    queryKey: ["hypotheses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hypotheses" as any)
        .select("*")
        .order("hypothesis_number");
      if (error) throw error;
      return (data as any[]) as Hypothesis[];
    },
  });
}

export function useUpdateHypothesis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      actual_value,
      admin_notes,
    }: {
      id: number;
      status?: string;
      actual_value?: string;
      admin_notes?: string;
    }) => {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (status !== undefined) updates.status = status;
      if (actual_value !== undefined) updates.actual_value = actual_value;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;

      const { error } = await supabase
        .from("hypotheses" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hypotheses"] }),
  });
}

export function useHypothesisMetrics() {
  return useQuery({
    queryKey: ["hypothesis-metrics"],
    queryFn: async () => {
      // Metric for H7: % of ratings 4/5+
      const { data: ratings } = await supabase.from("ratings").select("quality_score, communication_score, timing_score");
      let totalRatings = 0;
      let highRatings = 0;
      if (ratings) {
        totalRatings = ratings.length;
        highRatings = ratings.filter(
          (r) => (r.quality_score + r.communication_score + r.timing_score) / 3 >= 4
        ).length;
      }
      const ratingPct = totalRatings > 0 ? Math.round((highRatings / totalRatings) * 100) : null;

      // Metric for H8: % of completed projects without disputes
      const { count: completedProjects } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed");
      const { count: disputedProjects } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "disputed");
      const totalDone = (completedProjects ?? 0) + (disputedProjects ?? 0);
      const noDisputePct = totalDone > 0 ? Math.round(((completedProjects ?? 0) / totalDone) * 100) : null;

      // Metric for H18: % self-payment (escrow without grant_request_id)
      const { count: totalEscrow } = await supabase
        .from("escrow_transactions")
        .select("id", { count: "exact", head: true })
        .in("status", ["held", "released"]);
      const { count: selfPayEscrow } = await supabase
        .from("escrow_transactions")
        .select("id", { count: "exact", head: true })
        .in("status", ["held", "released"])
        .is("grant_request_id", null);
      const selfPayPct = (totalEscrow ?? 0) > 0 ? Math.round(((selfPayEscrow ?? 0) / (totalEscrow ?? 0)) * 100) : null;

      // Active providers (H1): providers with bids in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { count: totalProviders } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "service_provider");
      const { data: activeBidders } = await supabase
        .from("bids")
        .select("provider_id")
        .gte("created_at", thirtyDaysAgo);
      const uniqueActive = new Set(activeBidders?.map((b) => b.provider_id)).size;
      const activeProviderPct = (totalProviders ?? 0) > 0 ? Math.round((uniqueActive / (totalProviders ?? 0)) * 100) : null;

      return {
        ratingPct,       // H7
        noDisputePct,    // H8
        selfPayPct,      // H18
        activeProviderPct, // H1
        totalRatings,
        totalDone,
        totalEscrow: totalEscrow ?? 0,
        totalProviders: totalProviders ?? 0,
        uniqueActive,
      };
    },
    staleTime: 60_000,
  });
}
