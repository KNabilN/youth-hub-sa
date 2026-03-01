import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useMyDisputes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-disputes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*, projects(title, assigned_provider_id, association_id), profiles:raised_by(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter client-side: disputes where user is raiser or assigned provider
      return (data ?? []).filter(
        (d: any) =>
          d.raised_by === user!.id ||
          d.projects?.assigned_provider_id === user!.id ||
          d.projects?.association_id === user!.id
      );
    },
  });
}
