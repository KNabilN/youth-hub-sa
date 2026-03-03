import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useMyDisputes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-disputes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // RLS policy "Involved parties view disputes" already filters to only
      // disputes where user is raised_by or involved via the project
      const { data, error } = await supabase
        .from("disputes")
        .select("*, projects(title, assigned_provider_id, association_id), profiles:raised_by(full_name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
