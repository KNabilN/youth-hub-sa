import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAvailableProjects(filters?: { category_id?: string; region_id?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["available-projects", user?.id, filters],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, categories(*), regions(*)")
        .eq("status", "open")
        .eq("is_private", false)
        .order("created_at", { ascending: false });
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
        .select("*, categories(*), regions(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
