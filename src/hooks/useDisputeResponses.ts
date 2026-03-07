import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDisputeResponses(disputeId: string | undefined) {
  return useQuery({
    queryKey: ["dispute-responses", disputeId],
    enabled: !!disputeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dispute_responses" as any)
        .select("*, profiles:author_id(full_name, organization_name)")
        .eq("dispute_id", disputeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateDisputeResponse() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ disputeId, message }: { disputeId: string; message: string }) => {
      const { error } = await supabase
        .from("dispute_responses" as any)
        .insert({ dispute_id: disputeId, author_id: user!.id, message } as any);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["dispute-responses", variables.disputeId] });
    },
  });
}
