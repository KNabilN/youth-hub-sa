import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ bidId, projectId, providerId, price }: {
      bidId: string; projectId: string; providerId: string; price: number;
    }) => {
      // 1. Accept this bid
      await supabase.from("bids").update({ status: "accepted" }).eq("id", bidId);
      // 2. Reject all others
      await supabase.from("bids").update({ status: "rejected" }).eq("project_id", projectId).neq("id", bidId);
      // 3. Create contract
      const { error: contractError } = await supabase.from("contracts").insert({
        project_id: projectId,
        association_id: user!.id,
        provider_id: providerId,
        terms: `عقد تنفيذ طلب بقيمة ${price} ر.س`,
        association_signed_at: new Date().toISOString(),
      });
      if (contractError) throw contractError;
      // 4. Update project
      const { error: projectError } = await supabase.from("projects").update({
        status: "in_progress",
        assigned_provider_id: providerId,
      }).eq("id", projectId);
      if (projectError) throw projectError;

      // DB triggers handle all notifications (bid status change + contract creation + project status)
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
      // DB trigger notify_on_bid_change handles notification to provider
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bids"] }),
  });
}
