import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { sanitizeFormValues, PROJECT_UUID_FIELDS, PROJECT_NUMERIC_FIELDS } from "@/lib/sanitize";

export function useProjects(statusFilter?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-projects-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter: `association_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["projects"] });
          qc.invalidateQueries({ queryKey: ["project-stats"] });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["projects", user?.id, statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, categories(*), regions(*), cities(*), bids!bids_project_id_fkey(id, status)")
        .eq("association_id", user!.id)
        .is("deleted_at", null)
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
  const qc = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`rt-project-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter: `id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["project", id] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, qc]);

  return useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, categories(*), regions(*), cities(*)")
        .eq("id", id!)
        .is("deleted_at", null)
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
      const clean = sanitizeFormValues(values as Record<string, unknown>, PROJECT_UUID_FIELDS, PROJECT_NUMERIC_FIELDS);
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...clean, association_id: user!.id } as any)
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
      const clean = sanitizeFormValues(values as Record<string, unknown>, PROJECT_UUID_FIELDS, PROJECT_NUMERIC_FIELDS);
      const { data, error } = await supabase
        .from("projects")
        .update(clean as any)
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
      const { data: userProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("association_id", user!.id)
        .is("deleted_at", null);
      const projectIds = userProjects?.map(p => p.id) ?? [];

      const [projectsRes, timeLogsRes, contractsRes, ratingsRes, totalProjectsRes] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("association_id", user!.id).is("deleted_at", null).eq("status", "in_progress"),
        projectIds.length
          ? supabase.from("time_logs").select("hours").eq("approval", "pending").in("project_id", projectIds)
          : Promise.resolve({ data: [] as { hours: number }[] }),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("association_id", user!.id),
        supabase.from("ratings").select("quality_score, timing_score, communication_score").eq("rater_id", user!.id),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("association_id", user!.id).is("deleted_at", null),
      ]);

      const pendingHours = (timeLogsRes.data as { hours: number }[] | null)?.reduce((sum, t) => sum + Number(t.hours), 0) ?? 0;
      const ratings = ratingsRes.data ?? [];
      const avgRating = ratings.length
        ? (ratings.reduce((s, r) => s + (r.quality_score + r.timing_score + r.communication_score) / 3, 0) / ratings.length).toFixed(1)
        : "0";

      return {
        activeProjects: projectsRes.count ?? 0,
        pendingHours,
        activeContracts: contractsRes.count ?? 0,
        avgRating,
        totalRequests: totalProjectsRes.count ?? 0,
      };
    },
  });
}
