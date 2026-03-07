import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function useMyAssignedProjects(statusFilter?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-assigned-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter: `assigned_provider_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["my-assigned-projects"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["my-assigned-projects", user?.id, statusFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, categories(name), regions(name)")
        .eq("assigned_provider_id", user!.id)
        .is("deleted_at", null)
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
