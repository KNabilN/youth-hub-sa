import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBids(projectId: string | undefined) {
  return useQuery({
    queryKey: ["bids", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("*, profiles:provider_id(full_name, avatar_url)")
        .eq("project_id", projectId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAcceptBid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ bidId, projectId, providerId, bidPrice }: {
      bidId: string; projectId: string; providerId: string; bidPrice: number;
    }) => {
      // 1. Accept this bid
      await supabase.from("bids").update({ status: "accepted" }).eq("id", bidId);
      // 2. Reject all others
      await supabase.from("bids").update({ status: "rejected" }).eq("project_id", projectId).neq("id", bidId);
      // 3. Assign provider to project and update budget to match accepted bid price
      const { error: projectError } = await supabase.from("projects").update({
        assigned_provider_id: providerId,
        budget: bidPrice,
      }).eq("id", projectId);
      if (projectError) throw projectError;

      // Contract creation and status change to in_progress happen AFTER payment
      // DB triggers handle bid status notifications
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bids"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
  });
}

export function useRejectBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bidId: string) => {
      const { error } = await supabase.from("bids").update({ status: "rejected" }).eq("id", bidId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bids"] }),
  });
}
