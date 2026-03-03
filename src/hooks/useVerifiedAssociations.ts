import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useVerifiedAssociations() {
  return useQuery({
    queryKey: ["verified-associations"],
    queryFn: async () => {
      const { data: ids, error: rpcErr } = await supabase.rpc("get_verified_association_ids");
      if (rpcErr) throw rpcErr;
      if (!ids?.length) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, organization_name, avatar_url")
        .in("id", ids);
      if (error) throw error;
      return data;
    },
  });
}
