import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useContracts(filter = "all") {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["contracts", user?.id, role, filter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("contracts")
        .select("*, projects(title, status), profiles:provider_id(full_name)")
        .order("created_at", { ascending: false });

      if (role === "youth_association") {
        query = query.eq("association_id", user!.id);
      } else if (role === "service_provider") {
        query = query.eq("provider_id", user!.id);
      }

      if (filter === "unsigned") {
        query = query.is("association_signed_at", null).is("provider_signed_at", null);
      } else if (filter === "partial") {
        query = query.or("association_signed_at.not.is.null,provider_signed_at.not.is.null");
        // further filter would be complex; we filter client-side
      } else if (filter === "signed") {
        query = query.not("association_signed_at", "is", null).not("provider_signed_at", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (filter === "partial") {
        return (data ?? []).filter(
          (c: any) =>
            (c.association_signed_at && !c.provider_signed_at) ||
            (!c.association_signed_at && c.provider_signed_at)
        );
      }
      return data ?? [];
    },
  });
}

export function useSignContract() {
  const qc = useQueryClient();
  const { role } = useAuth();
  return useMutation({
    mutationFn: async (contractId: string) => {
      const field = role === "youth_association" ? "association_signed_at" : "provider_signed_at";
      const { error } = await supabase
        .from("contracts")
        .update({ [field]: new Date().toISOString() } as any)
        .eq("id", contractId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useProviderContract(bidId: string | undefined) {
  return useQuery({
    queryKey: ["provider-contract", bidId],
    enabled: !!bidId,
    queryFn: async () => {
      // Find contract linked to same project as this bid
      const { data: bid } = await supabase
        .from("bids")
        .select("project_id, provider_id")
        .eq("id", bidId!)
        .single();
      if (!bid) return null;

      const { data } = await supabase
        .from("contracts")
        .select("*")
        .eq("project_id", bid.project_id)
        .eq("provider_id", bid.provider_id)
        .maybeSingle();
      return data;
    },
  });
}
