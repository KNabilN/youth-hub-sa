import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDisputeStatusLog(disputeId: string | undefined) {
  return useQuery({
    queryKey: ["dispute-status-log", disputeId],
    enabled: !!disputeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dispute_status_log" as any)
        .select("*, profiles:changed_by(full_name, organization_name)")
        .eq("dispute_id", disputeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}
