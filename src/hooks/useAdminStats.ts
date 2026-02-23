import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, projectsRes, disputesRes, invoicesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("invoices").select("commission_amount"),
      ]);

      const revenue = (invoicesRes.data ?? []).reduce((sum, inv) => sum + Number(inv.commission_amount), 0);

      return {
        totalUsers: usersRes.count ?? 0,
        totalProjects: projectsRes.count ?? 0,
        openDisputes: disputesRes.count ?? 0,
        revenue,
      };
    },
  });
}
