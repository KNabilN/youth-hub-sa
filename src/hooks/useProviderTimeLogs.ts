import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useProviderTimeLogs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["provider-time-logs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_logs")
        .select("*, projects(title)")
        .eq("provider_id", user!.id)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAssignedProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["assigned-projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .eq("assigned_provider_id", user!.id)
        .in("status", ["in_progress"]);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTimeLog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { project_id: string; log_date: string; hours: number; description: string }) => {
      const { data, error } = await supabase
        .from("time_logs")
        .insert({ ...values, provider_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-time-logs"] }),
  });
}
