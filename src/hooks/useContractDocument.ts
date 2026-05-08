import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContractDocumentData {
  contract: any;
  project: any | null;
  acceptedBid: any | null;
  service: any | null;
  escrow: any | null;
  association: any | null;
  provider: any | null;
  scope: string;
}

function extractScope(terms: string): string {
  if (!terms) return "";
  const m = terms.match(/نطاق العمل:\s*([\s\S]*?)(?:\n\n|$)/);
  return (m ? m[1] : terms).trim();
}

export function useContractDocument(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract-document", contractId],
    enabled: !!contractId,
    queryFn: async (): Promise<ContractDocumentData | null> => {
      const { data: contract, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractId!)
        .maybeSingle();
      if (error) throw error;
      if (!contract) return null;

      const [
        { data: project },
        { data: association },
        { data: provider },
        { data: escrow },
        { data: bid },
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("*, categories(name), regions(name), cities(name)")
          .eq("id", contract.project_id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select(
            "id, full_name, organization_name, user_number, contact_officer_name, contact_officer_title, contact_officer_email, contact_officer_phone, license_number, phone",
          )
          .eq("id", contract.association_id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select(
            "id, full_name, organization_name, user_number, contact_officer_name, contact_officer_email, contact_officer_phone, phone",
          )
          .eq("id", contract.provider_id)
          .maybeSingle(),
        supabase
          .from("escrow_transactions")
          .select("*")
          .eq("project_id", contract.project_id)
          .maybeSingle(),
        supabase
          .from("bids")
          .select("*")
          .eq("project_id", contract.project_id)
          .eq("provider_id", contract.provider_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      let service = null;
      if (escrow?.service_id) {
        const { data: svc } = await supabase
          .from("micro_services")
          .select(
            "id, title, description, long_description, service_number, price",
          )
          .eq("id", escrow.service_id)
          .maybeSingle();
        service = svc;
      }

      return {
        contract,
        project,
        acceptedBid: bid,
        service,
        escrow,
        association,
        provider,
        scope: extractScope(contract.terms || ""),
      };
    },
  });
}
