import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDonorStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["donor-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("amount, project_id, projects(association_id)")
        .eq("donor_id", user!.id);
      if (error) throw error;

      const totalDonations = data.reduce((sum, d) => sum + Number(d.amount), 0);
      const projectIds = new Set(data.filter(d => d.project_id).map(d => d.project_id));
      const associationIds = new Set(
        data
          .filter(d => d.projects && (d.projects as any).association_id)
          .map(d => (d.projects as any).association_id)
      );

      return {
        totalDonations,
        projectsFunded: projectIds.size,
        associationsSupported: associationIds.size,
      };
    },
    enabled: !!user,
  });
}

export function useDonorFundConsumption() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["donor-fund-consumption", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("amount, project_id, projects(status)")
        .eq("donor_id", user!.id);
      if (error) throw error;

      let activeFunds = 0;
      let completedFunds = 0;
      (data ?? []).forEach(d => {
        const status = (d.projects as any)?.status;
        if (status === "completed") {
          completedFunds += Number(d.amount);
        } else if (status && status !== "cancelled") {
          activeFunds += Number(d.amount);
        }
      });

      return { activeFunds, completedFunds };
    },
    enabled: !!user,
  });
}
