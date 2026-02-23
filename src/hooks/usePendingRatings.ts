import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function usePendingRatings() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["pending-ratings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get completed contracts where user is a party
      const isAssociation = role === "youth_association";
      const column = isAssociation ? "association_id" : "provider_id";

      const { data: contracts, error: cErr } = await supabase
        .from("contracts")
        .select("id, project_id, projects(title)")
        .eq(column, user!.id)
        .not("association_signed_at", "is", null)
        .not("provider_signed_at", "is", null);
      if (cErr) throw cErr;
      if (!contracts?.length) return [];

      // Get ratings user already submitted
      const { data: ratings, error: rErr } = await supabase
        .from("ratings")
        .select("contract_id")
        .eq("rater_id", user!.id);
      if (rErr) throw rErr;

      const ratedIds = new Set(ratings?.map(r => r.contract_id));
      return contracts.filter(c => !ratedIds.has(c.id));
    },
  });
}
