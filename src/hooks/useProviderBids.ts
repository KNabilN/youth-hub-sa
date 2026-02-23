import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useProviderBids(statusFilter?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["provider-bids", user?.id, statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("bids")
        .select("*, projects(title, budget)")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitBid() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { project_id: string; price: number; timeline_days: number; cover_letter: string }) => {
      const { data, error } = await supabase
        .from("bids")
        .insert({ ...values, provider_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider-bids"] });
      qc.invalidateQueries({ queryKey: ["bids"] });
    },
  });
}

export function useWithdrawBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bidId: string) => {
      const { error } = await supabase.from("bids").update({ status: "withdrawn" }).eq("id", bidId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-bids"] }),
  });
}
