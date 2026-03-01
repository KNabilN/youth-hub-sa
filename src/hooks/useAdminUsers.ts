import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminUsers(from = 0, to = 19, roleFilter?: string) {
  return useQuery({
    queryKey: ["admin-users", from, to, roleFilter],
    queryFn: async () => {
      // First get role data, optionally filtered
      let rolesQuery = supabase.from("user_roles").select("user_id, role");
      if (roleFilter && roleFilter !== "all") {
        rolesQuery = rolesQuery.eq("role", roleFilter as any);
      }
      const { data: roles, error: rolesError } = await rolesQuery;
      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);

      // If filtering by role, only fetch those specific profiles
      let profilesQuery = supabase.from("profiles").select("*").order("created_at", { ascending: false });

      if (roleFilter && roleFilter !== "all") {
        const userIds = roles?.map((r) => r.user_id) ?? [];
        if (userIds.length === 0) return [];
        profilesQuery = profilesQuery.in("id", userIds);
      }

      profilesQuery = profilesQuery.range(from, to);
      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

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
    mutationFn: async ({ id, is_suspended, suspension_reason }: { id: string; is_suspended: boolean; suspension_reason?: string }) => {
      const update: any = { is_suspended };
      if (is_suspended && suspension_reason) {
        update.suspension_reason = suspension_reason;
      } else if (!is_suspended) {
        update.suspension_reason = "";
      }
      const { error } = await supabase.from("profiles").update(update).eq("id", id);
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

export function useAdminUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("profiles").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}
