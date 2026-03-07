import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useBidComments(bidId: string | undefined) {
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
      const { data, error } = await supabase
        .from("bid_comments")
        .insert({ bid_id: bidId, author_id: user!.id, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["bid-comments", vars.bidId] });
    },
  });
}
