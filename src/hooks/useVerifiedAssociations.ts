import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useVerifiedAssociations() {
  return useQuery({
    queryKey: ["verified-associations"],
    queryFn: async () => {
      // Get user_ids with youth_association role
      const { data: roleData, error: roleErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "youth_association");
      if (roleErr) throw roleErr;

      const ids = roleData.map((r) => r.user_id);
      if (!ids.length) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, organization_name, avatar_url")
        .eq("is_verified", true)
        .in("id", ids);
      if (error) throw error;
      return data;
    },
  });
}
