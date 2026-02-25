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
    mutationFn: async (values: { project_id: string; log_date: string; hours: number; description: string; start_time?: string; end_time?: string }) => {
      const payload: any = { project_id: values.project_id, log_date: values.log_date, hours: values.hours, description: values.description, provider_id: user!.id };
      if (values.start_time) payload.start_time = values.start_time;
      if (values.end_time) payload.end_time = values.end_time;
      const { data, error } = await supabase
        .from("time_logs")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-time-logs"] }),
  });
}
