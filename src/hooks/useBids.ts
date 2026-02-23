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
      await supabase.from("contracts").insert({
        project_id: projectId,
        association_id: user!.id,
        provider_id: providerId,
        terms: `عقد تنفيذ مشروع بقيمة ${price} ر.س`,
        association_signed_at: new Date().toISOString(),
      });
      // 4. Update project
      await supabase.from("projects").update({
        status: "in_progress",
        assigned_provider_id: providerId,
      }).eq("id", projectId);
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
