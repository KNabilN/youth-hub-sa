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
        .select("*, projects(title, status), profiles:provider_id(full_name, organization_name)")
        .is("deleted_at", null)
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

      // Re-fetch contract to check if both signed
      const { data: contract } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .single();

      if (!contract) return;

      // If both signed, check if escrow already exists (bank transfer flow) or create new
      if (contract.association_signed_at && contract.provider_signed_at) {
        // Check if a held escrow already exists for this project
        const { data: existingEscrow } = await supabase
          .from("escrow_transactions")
          .select("id, status")
          .eq("project_id", contract.project_id)
          .maybeSingle();

        if (existingEscrow && (existingEscrow.status === "held" || existingEscrow.status === "pending_payment")) {
          // Bank transfer flow — escrow already exists, start the project
          await supabase
            .from("projects")
            .update({ status: "in_progress" as any })
            .eq("id", contract.project_id);
          // DB trigger notify_on_project_status_change handles notifications
        } else if (!existingEscrow) {
          // Regular flow — create escrow from accepted bid
          const { data: bid } = await supabase
            .from("bids")
            .select("price")
            .eq("project_id", contract.project_id)
            .eq("status", "accepted")
            .maybeSingle();

          if (bid) {
            await supabase.from("escrow_transactions").insert({
              project_id: contract.project_id,
              payer_id: contract.association_id,
              payee_id: contract.provider_id,
              amount: bid.price,
              status: "held",
            });
          } else {
            throw new Error("لم يتم العثور على عرض سعر مقبول لإنشاء الضمان المالي. يرجى التأكد من قبول عرض سعر قبل توقيع العقد.");
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["contract"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
  });
}

export function useProviderContract(bidId: string | undefined) {
  return useQuery({
    queryKey: ["provider-contract", bidId],
    enabled: !!bidId,
    queryFn: async () => {
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
