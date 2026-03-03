import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDonorPurchases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["donor-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escrow_transactions")
        .select(`
          id, amount, status, created_at, service_id, project_id,
          micro_services:service_id(id, title, image_url, provider_id, profiles:provider_id(full_name)),
          projects:project_id(id, title, status, association_id, profiles:association_id(full_name, organization_name))
        `)
        .eq("payer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}
