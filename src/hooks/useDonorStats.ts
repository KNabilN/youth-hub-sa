import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function useDonorStats() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-donor-stats-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "donor_contributions" },
        () => {
          qc.invalidateQueries({ queryKey: ["donor-stats"] });
          qc.invalidateQueries({ queryKey: ["donor-balances"] });
          qc.invalidateQueries({ queryKey: ["donor-contributions"] });
          qc.invalidateQueries({ queryKey: ["donor-consumed-breakdown"] });
          qc.invalidateQueries({ queryKey: ["journey-donor"] });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["donor-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("amount, donation_status, project_id, association_id, projects(association_id)")
        .eq("donor_id", user!.id);
      if (error) throw error;

      const totalDonations = data.reduce((sum, d) => sum + Number(d.amount), 0);
      const availableBalance = data
        .filter(d => (d as any).donation_status === "available")
        .reduce((sum, d) => sum + Number(d.amount), 0);
      const projectIds = new Set(data.filter(d => d.project_id).map(d => d.project_id));
      const associationIds = new Set(
        data
          .filter(d => (d as any).association_id || (d.projects && (d.projects as any).association_id))
          .map(d => (d as any).association_id || (d.projects as any).association_id)
      );

      return {
        totalDonations,
        availableBalance,
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

export function useDonorBalances() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["donor-balances", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("amount, donation_status")
        .eq("donor_id", user!.id);
      if (error) throw error;

      const balances = { available: 0, reserved: 0, consumed: 0, suspended: 0, expired: 0 };
      (data ?? []).forEach(d => {
        const status = (d as any).donation_status || "available";
        const amount = Number(d.amount);
        if (status in balances) {
          balances[status as keyof typeof balances] += amount;
        } else {
          balances.available += amount;
        }
      });

      return balances;
    },
    enabled: !!user,
  });
}
