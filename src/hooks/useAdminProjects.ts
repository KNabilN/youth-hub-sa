import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

export function useAdminProjects(from = 0, to = 19) {
  return useQuery({
    queryKey: ["admin-projects", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, categories(name), regions(name), cities(name), profiles!projects_association_id_fkey(full_name, organization_name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProjectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProjectStatus }) => {
      const { error } = await supabase.from("projects").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-projects"] }),
  });
}

export function useAdminUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("projects").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      qc.invalidateQueries({ queryKey: ["admin-project-detail", variables.id] });
    },
  });
}

export function useToggleProjectNameVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, visible }: { projectId: string; visible: boolean }) => {
      const { error } = await supabase.from("projects").update({ is_name_visible: visible }).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-projects"] }),
  });
}
