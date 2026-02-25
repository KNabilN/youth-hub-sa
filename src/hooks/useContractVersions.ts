import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useContractVersions(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract-versions", contractId],
    enabled: !!contractId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_versions")
        .select("*, profiles:changed_by(full_name)")
        .eq("contract_id", contractId!)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateContractVersion() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ contractId, terms, changeNote }: { contractId: string; terms: string; changeNote: string }) => {
      // Get next version number
      const { data: existing } = await supabase
        .from("contract_versions")
        .select("version_number")
        .eq("contract_id", contractId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = (existing?.[0]?.version_number ?? 0) + 1;

      const { data, error } = await supabase
        .from("contract_versions")
        .insert({
          contract_id: contractId,
          version_number: nextVersion,
          terms,
          changed_by: user!.id,
          change_note: changeNote,
        })
        .select()
        .single();
      if (error) throw error;

      // Update the contract's current terms
      await supabase
        .from("contracts")
        .update({ terms } as any)
        .eq("id", contractId);

      return data;
    },
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: ["contract-versions", contractId] });
      qc.invalidateQueries({ queryKey: ["contract"] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}
