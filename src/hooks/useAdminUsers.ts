import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles and roles separately since there's no direct FK between them
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      // Merge roles into profiles
      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
      return (profiles ?? []).map((p) => ({
        ...p,
        user_roles: roleMap.has(p.id) ? [{ role: roleMap.get(p.id)! }] : [],
      }));
    },
  });
}

export function useToggleVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_verified }: { id: string; is_verified: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useToggleSuspension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_suspended }: { id: string; is_suspended: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_suspended }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}
