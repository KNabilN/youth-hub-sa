import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function useAssociationTimeLogs(approvalFilter?: string, projectFilter?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-timelogs-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "time_logs" },
        () => qc.invalidateQueries({ queryKey: ["time-logs"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["time-logs", user?.id, approvalFilter, projectFilter],
    enabled: !!user,
    queryFn: async () => {
      const projectIds = (await supabase.from("projects").select("id").eq("association_id", user!.id)).data?.map(p => p.id) ?? [];
      if (!projectIds.length) return [];
      let query = supabase
        .from("time_logs")
        .select("*, projects(title), profiles:provider_id(full_name)")
        .in("project_id", projectIds)
        .order("log_date", { ascending: false });
      if (approvalFilter && approvalFilter !== "all") {
        query = query.eq("approval", approvalFilter as any);
      }
      if (projectFilter && projectFilter !== "all") {
        query = query.eq("project_id", projectFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAssociationProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["association-projects-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .eq("association_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProjectTimeLogs(projectId?: string) {
  return useQuery({
    queryKey: ["project-time-logs-summary", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_logs")
        .select("hours, approval")
        .eq("project_id", projectId!);
      if (error) throw error;
      const totalLogged = data.reduce((s, l) => s + Number(l.hours), 0);
      const approvedHours = data.filter(l => l.approval === "approved").reduce((s, l) => s + Number(l.hours), 0);
      const pendingHours = data.filter(l => l.approval === "pending").reduce((s, l) => s + Number(l.hours), 0);
      return { totalLogged, approvedHours, pendingHours, count: data.length };
    },
  });
}

export function useUpdateTimeLogApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approval, rejectionReason }: { id: string; approval: "approved" | "rejected"; providerId: string; rejectionReason?: string }) => {
      const update: any = { approval };
      if (approval === "rejected" && rejectionReason) {
        update.rejection_reason = rejectionReason;
      }
      const { error } = await supabase.from("time_logs").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-logs"] }),
  });
}
