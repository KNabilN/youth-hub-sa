import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export function useProjects(statusFilter?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id, statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, categories(*), regions(*)")
        .eq("association_id", user!.id)
        .order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, categories(*), regions(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<"projects">, "association_id">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...values, association_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: TablesUpdate<"projects"> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", data.id] });
    },
  });
}

export function useUpdateProjectStatusByAssociation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "pending_approval" | "suspended" | "archived" | "cancelled" }) => {
      const { error } = await supabase.from("projects").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useProjectStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["project-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [projectsRes, timeLogsRes, contractsRes, ratingsRes] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("association_id", user!.id).eq("status", "in_progress"),
        supabase.from("time_logs").select("hours").eq("approval", "pending").in("project_id",
          (await supabase.from("projects").select("id").eq("association_id", user!.id)).data?.map(p => p.id) ?? []
        ),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("association_id", user!.id),
        supabase.from("ratings").select("quality_score, timing_score, communication_score").eq("rater_id", user!.id),
      ]);

      const pendingHours = timeLogsRes.data?.reduce((sum, t) => sum + Number(t.hours), 0) ?? 0;
      const ratings = ratingsRes.data ?? [];
      const avgRating = ratings.length
        ? (ratings.reduce((s, r) => s + (r.quality_score + r.timing_score + r.communication_score) / 3, 0) / ratings.length).toFixed(1)
        : "0";

      return {
        activeProjects: projectsRes.count ?? 0,
        pendingHours,
        activeContracts: contractsRes.count ?? 0,
        avgRating,
      };
    },
  });
}
