import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function useBids(projectId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`rt-bids-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids", filter: `project_id=eq.${projectId}` },
        () => qc.invalidateQueries({ queryKey: ["bids", projectId] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, qc]);

  return useQuery({
    queryKey: ["bids", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("*, profiles:provider_id(full_name, avatar_url, organization_name)")
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
      await supabase.from("bids").update({ status: "accepted" }).eq("id", bidId);
      await supabase.from("bids").update({ status: "rejected" }).eq("project_id", projectId).neq("id", bidId);
      const { error: projectError } = await supabase.from("projects").update({
        assigned_provider_id: providerId,
        budget: bidPrice,
      }).eq("id", projectId);
      if (projectError) throw projectError;
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
