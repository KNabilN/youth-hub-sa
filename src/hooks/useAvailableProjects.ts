import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function useAvailableProjects(filters?: { category_id?: string; region_id?: string }, from = 0, to = 19) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("rt-available-projects")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" },
        () => qc.invalidateQueries({ queryKey: ["available-projects"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["available-projects", user?.id, filters, from, to],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, categories(*), regions(*), cities(*), profiles!projects_association_id_fkey(full_name, avatar_url, organization_name)")
        .eq("status", "open")
        .eq("is_private", false)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (filters?.category_id) query = query.eq("category_id", filters.category_id);
      if (filters?.region_id) query = query.eq("region_id", filters.region_id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAvailableProject(id: string | undefined) {
  return useQuery({
    queryKey: ["available-project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, categories(*), regions(*), cities(*), profiles!projects_association_id_fkey(full_name, avatar_url, organization_name)")
        .eq("id", id!)
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
