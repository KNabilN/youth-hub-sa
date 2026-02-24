import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminUserServices(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-services", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("*, categories(name)")
        .eq("provider_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminUserProjects(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-projects", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, categories(name), regions(name)")
        .or(`association_id.eq.${userId},assigned_provider_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminUserContracts(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-contracts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, projects(title)")
        .or(`provider_id.eq.${userId},association_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminUserDisputes(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-disputes", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*, projects(title)")
        .eq("raised_by", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminUserTimeLogs(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-timelogs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_logs")
        .select("*, projects(title)")
        .eq("provider_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminUserEditRequests(userId: string | null) {
  return useQuery({
    queryKey: ["admin-user-editrequests", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edit_requests")
        .select("*")
        .eq("target_user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
