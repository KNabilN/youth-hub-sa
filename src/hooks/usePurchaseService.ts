import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePurchaseService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      serviceId,
      providerId,
      buyerId,
      amount,
      beneficiaryId,
      serviceTitle,
    }: {
      serviceId: string;
      providerId: string;
      buyerId: string;
      amount: number;
      beneficiaryId?: string;
      serviceTitle?: string;
    }) => {
      let projectId: string | null = null;

      // If a beneficiary association is selected, create a project automatically
      if (beneficiaryId) {
        const title = serviceTitle || "خدمة ممولة من مانح";
        const { data: project, error: projErr } = await supabase
          .from("projects")
          .insert({
            title,
            description: `خدمة ممولة تلقائياً من مانح — ${title}`,
            association_id: beneficiaryId,
            assigned_provider_id: providerId,
            status: "in_progress" as any,
            budget: amount,
            is_private: true,
          })
          .select("id")
          .single();
        if (projErr) throw projErr;
        projectId = project.id;

        // Notify the association
        await supabase.from("notifications").insert({
          user_id: beneficiaryId,
          message: `قام مانح بتمويل خدمة "${title}" لصالح جمعيتكم`,
          type: "donor_funded_service",
        });
      }

      // Create escrow transaction
      const { data: escrow, error: escrowErr } = await supabase
        .from("escrow_transactions")
        .insert({
          service_id: serviceId,
          payer_id: buyerId,
          payee_id: providerId,
          amount,
          status: "held",
          project_id: projectId,
          beneficiary_id: beneficiaryId || null,
        } as any)
        .select()
        .single();
      if (escrowErr) throw escrowErr;

      // Also create donor_contributions record
      await supabase.from("donor_contributions").insert({
        donor_id: buyerId,
        service_id: serviceId,
        association_id: beneficiaryId || null,
        amount,
      });

      return escrow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      qc.invalidateQueries({ queryKey: ["donor-contributions"] });
      qc.invalidateQueries({ queryKey: ["donor-purchases"] });
    },
  });
}
