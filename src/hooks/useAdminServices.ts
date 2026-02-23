import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

export function useAdminServices() {
  return useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("*, categories(name), regions(name), profiles!micro_services_provider_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateServiceApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approval }: { id: string; approval: ApprovalStatus }) => {
      const { error } = await supabase.from("micro_services").update({ approval }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  });
}
