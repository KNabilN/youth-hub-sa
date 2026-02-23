import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminUsers(from = 0, to = 19) {
  return useQuery({
    queryKey: ["admin-users", from, to],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

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

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}
