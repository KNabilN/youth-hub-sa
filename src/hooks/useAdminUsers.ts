import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminUsersFilters {
  roleFilter?: string;
  regionId?: string;
  cityId?: string;
  dateFrom?: string;
  dateTo?: string;
  verifiedFilter?: string;
  search?: string;
}

export function useAdminUsers(from = 0, to = 19, filters?: AdminUsersFilters) {
  const roleFilter = filters?.roleFilter;
  const regionId = filters?.regionId;
  const cityId = filters?.cityId;
  const dateFrom = filters?.dateFrom;
  const dateTo = filters?.dateTo;
  const verifiedFilter = filters?.verifiedFilter;
  const search = filters?.search;

  return useQuery({
    queryKey: ["admin-users", from, to, roleFilter, regionId, cityId, dateFrom, dateTo, verifiedFilter, search],
    queryFn: async () => {
      // First get role data, optionally filtered
      let rolesQuery = supabase.from("user_roles").select("user_id, role");
      if (roleFilter && roleFilter !== "all") {
        rolesQuery = rolesQuery.eq("role", roleFilter as any);
      }
      const { data: roles, error: rolesError } = await rolesQuery;
      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);

      // If filtering by region/city, find user IDs that have services or projects in that region/city
      let locationUserIds: string[] | null = null;
      if ((regionId && regionId !== "all") || (cityId && cityId !== "all")) {
        const userIdSet = new Set<string>();

        // Search in services
        let svcQuery = supabase.from("micro_services").select("provider_id");
        if (cityId && cityId !== "all") {
          svcQuery = svcQuery.eq("city_id", cityId);
        } else if (regionId && regionId !== "all") {
          svcQuery = svcQuery.eq("region_id", regionId);
        }
        const { data: svcData } = await svcQuery;
        svcData?.forEach((s) => userIdSet.add(s.provider_id));

        // Search in projects
        let projQuery = supabase.from("projects").select("association_id");
        if (cityId && cityId !== "all") {
          projQuery = projQuery.eq("city_id", cityId);
        } else if (regionId && regionId !== "all") {
          projQuery = projQuery.eq("region_id", regionId);
        }
        const { data: projData } = await projQuery;
        projData?.forEach((p) => userIdSet.add(p.association_id));

        locationUserIds = Array.from(userIdSet);
        if (locationUserIds.length === 0) return [];
      }

      // Build profiles query
      let profilesQuery = supabase.from("profiles").select("*").is("deleted_at", null).order("is_verified", { ascending: true }).order("created_at", { ascending: false });

      if (search) {
        profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,organization_name.ilike.%${search}%,user_number.ilike.%${search}%`);
      }

      if (roleFilter && roleFilter !== "all") {
        const userIds = roles?.map((r) => r.user_id) ?? [];
        if (userIds.length === 0) return [];
        profilesQuery = profilesQuery.in("id", userIds);
      }

      if (locationUserIds) {
        profilesQuery = profilesQuery.in("id", locationUserIds);
      }

      if (dateFrom) {
        profilesQuery = profilesQuery.gte("created_at", dateFrom);
      }
      if (dateTo) {
        profilesQuery = profilesQuery.lte("created_at", dateTo + "T23:59:59");
      }

      if (verifiedFilter === "verified") {
        profilesQuery = profilesQuery.eq("is_verified", true);
      } else if (verifiedFilter === "unverified") {
        profilesQuery = profilesQuery.eq("is_verified", false);
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

export function useAdminUsersCount(filters?: AdminUsersFilters) {
  const roleFilter = filters?.roleFilter;
  const regionId = filters?.regionId;
  const cityId = filters?.cityId;
  const dateFrom = filters?.dateFrom;
  const dateTo = filters?.dateTo;
  const verifiedFilter = filters?.verifiedFilter;
  const search = filters?.search;

  return useQuery({
    queryKey: ["admin-users-count", roleFilter, regionId, cityId, dateFrom, dateTo, verifiedFilter, search],
    queryFn: async () => {
      let rolesQuery = supabase.from("user_roles").select("user_id, role");
      if (roleFilter && roleFilter !== "all") {
        rolesQuery = rolesQuery.eq("role", roleFilter as any);
      }
      const { data: roles, error: rolesError } = await rolesQuery;
      if (rolesError) throw rolesError;

      let locationUserIds: string[] | null = null;
      if ((regionId && regionId !== "all") || (cityId && cityId !== "all")) {
        const userIdSet = new Set<string>();
        let svcQuery = supabase.from("micro_services").select("provider_id");
        if (cityId && cityId !== "all") svcQuery = svcQuery.eq("city_id", cityId);
        else if (regionId && regionId !== "all") svcQuery = svcQuery.eq("region_id", regionId);
        const { data: svcData } = await svcQuery;
        svcData?.forEach((s) => userIdSet.add(s.provider_id));
        let projQuery = supabase.from("projects").select("association_id");
        if (cityId && cityId !== "all") projQuery = projQuery.eq("city_id", cityId);
        else if (regionId && regionId !== "all") projQuery = projQuery.eq("region_id", regionId);
        const { data: projData } = await projQuery;
        projData?.forEach((p) => userIdSet.add(p.association_id));
        locationUserIds = Array.from(userIdSet);
        if (locationUserIds.length === 0) return 0;
      }

      let countQuery = supabase.from("profiles").select("*", { count: "exact", head: true }).is("deleted_at", null);
      if (search) {
        countQuery = countQuery.or(`full_name.ilike.%${search}%,organization_name.ilike.%${search}%,user_number.ilike.%${search}%`);
      }
      if (roleFilter && roleFilter !== "all") {
        const userIds = roles?.map((r) => r.user_id) ?? [];
        if (userIds.length === 0) return 0;
        countQuery = countQuery.in("id", userIds);
      }
      if (locationUserIds) countQuery = countQuery.in("id", locationUserIds);
      if (dateFrom) countQuery = countQuery.gte("created_at", dateFrom);
      if (dateTo) countQuery = countQuery.lte("created_at", dateTo + "T23:59:59");
      if (verifiedFilter === "verified") countQuery = countQuery.eq("is_verified", true);
      else if (verifiedFilter === "unverified") countQuery = countQuery.eq("is_verified", false);

      const { count, error } = await countQuery;
      if (error) throw error;
      return count ?? 0;
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-by-id"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-by-id"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-by-id"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}
