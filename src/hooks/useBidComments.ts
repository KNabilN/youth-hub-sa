import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function useBidComments(bidId: string | undefined) {
  const qc = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!bidId) return;
    const channel = supabase
      .channel(`bid-comments-${bidId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bid_comments", filter: `bid_id=eq.${bidId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["bid-comments", bidId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bidId, qc]);

  return useQuery({
    queryKey: ["bid-comments", bidId],
    enabled: !!bidId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_comments")
        .select("*, profiles:author_id(full_name, avatar_url, organization_name)")
        .eq("bid_id", bidId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddBidComment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ bidId, content }: { bidId: string; content: string }) => {
      const { error } = await supabase
        .from("bid_comments")
        .insert({ bid_id: bidId, author_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["bid-comments", vars.bidId] });
    },
  });
}
