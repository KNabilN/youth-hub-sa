import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminUserById(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-by-id", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (profileError) throw profileError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (rolesError) throw rolesError;

      return {
        ...profile,
        user_roles: roles ?? [],
      };
    },
  });
}
