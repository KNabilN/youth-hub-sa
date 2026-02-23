import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useMyAssignedProjects(statusFilter?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-assigned-projects", user?.id, statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, categories(name), regions(name)")
        .eq("assigned_provider_id", user!.id)
        .order("updated_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      } else {
        query = query.in("status", ["in_progress", "completed", "disputed"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
