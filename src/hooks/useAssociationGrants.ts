import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useReceivedGrants() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["association-received-grants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("*, profiles:donor_id(full_name, organization_name, avatar_url), projects(title), micro_services(title)")
        .eq("association_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAssociationGrantBalance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["association-grant-balance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("amount, donation_status")
        .eq("association_id", user!.id);
      if (error) throw error;

      const rows = data ?? [];
      const total = rows.reduce((s, r) => s + Number(r.amount), 0);
      const available = rows.filter(r => r.donation_status === "available").reduce((s, r) => s + Number(r.amount), 0);
      const consumed = rows.filter(r => r.donation_status === "consumed").reduce((s, r) => s + Number(r.amount), 0);
      const reserved = total - available - consumed;

      return { total, available, consumed, reserved, donorCount: new Set(rows.map(() => "")).size };
    },
  });
}

export function useAssociationGrantStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["association-grant-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("amount, donation_status, donor_id")
        .eq("association_id", user!.id);
      if (error) throw error;

      const rows = data ?? [];
      const totalGrants = rows.reduce((s, r) => s + Number(r.amount), 0);
      const available = rows.filter(r => r.donation_status === "available").reduce((s, r) => s + Number(r.amount), 0);
      const donorIds = new Set(rows.map(r => r.donor_id));

      return { totalGrants, availableBalance: available, donorCount: donorIds.size };
    },
  });
}
