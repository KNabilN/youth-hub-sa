import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SignatureStatus = "unsigned" | "partial" | "completed";

export interface AdminContract {
  id: string;
  created_at: string;
  association_signed_at: string | null;
  provider_signed_at: string | null;
  terms: string;
  project: { title: string; request_number: string } | null;
  association: { full_name: string; organization_name: string | null } | null;
  provider: { full_name: string; organization_name: string | null } | null;
  signatureStatus: SignatureStatus;
}

export function getSignatureStatus(
  associationSigned: string | null,
  providerSigned: string | null
): SignatureStatus {
  if (associationSigned && providerSigned) return "completed";
  if (associationSigned || providerSigned) return "partial";
  return "unsigned";
}

export function useAdminContracts() {
  return useQuery({
    queryKey: ["admin-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          id, created_at, association_signed_at, provider_signed_at, terms,
          project:projects(title, request_number),
          association:profiles!contracts_association_id_fkey(full_name, organization_name),
          provider:profiles!contracts_provider_id_fkey(full_name, organization_name)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        signatureStatus: getSignatureStatus(c.association_signed_at, c.provider_signed_at),
      })) as AdminContract[];
    },
  });
}
