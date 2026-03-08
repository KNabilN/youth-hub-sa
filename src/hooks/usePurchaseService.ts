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
      hours,
    }: {
      serviceId: string;
      providerId: string;
      buyerId: string;
      amount: number;
      beneficiaryId?: string;
      serviceTitle?: string;
      hours?: number;
    }) => {
      // Check if buyer is an association
      const { data: buyerRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", buyerId)
        .single();
      const isAssociation = buyerRole?.role === "youth_association";

      let projectId: string | null = null;

      // If a beneficiary association is selected, create a project automatically
      if (beneficiaryId) {
        const title = serviceTitle || "خدمة ممولة من مانح";
        const hoursNote = hours ? ` (${hours} ساعة)` : "";
        const { data: project, error: projErr } = await supabase
          .from("projects")
          .insert({
            title: title + hoursNote,
            description: `خدمة ممولة تلقائياً من مانح — ${title}${hoursNote}`,
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
      } else if (isAssociation) {
        // Association buying directly — auto-create project + contract
        const title = serviceTitle || "خدمة من السوق";
        const hoursNote = hours ? ` (${hours} ساعة)` : "";
        const { data: project, error: projErr } = await supabase
          .from("projects")
          .insert({
            title: title + hoursNote,
            description: `شراء مباشر من السوق — ${title}${hoursNote}`,
            association_id: buyerId,
            assigned_provider_id: providerId,
            status: "in_progress" as any,
            budget: amount,
            is_private: true,
          })
          .select("id")
          .single();
        if (projErr) throw projErr;
        projectId = project.id;

        // Create contract WITHOUT auto-signing — association must review and sign
        const contractTerms = `نطاق العمل:\n${title}${hoursNote}\n\nشراء مباشر من السوق — يلتزم مقدم الخدمة بتنفيذ الخدمة وفق الوصف المتفق عليه.`;
        await supabase.from("contracts").insert({
          project_id: project.id,
          association_id: buyerId,
          provider_id: providerId,
          terms: contractTerms,
        });

        // Create auto-accepted bid so provider appears in bids tab
        await supabase.from("bids").insert({
          project_id: project.id,
          provider_id: providerId,
          price: amount,
          timeline_days: 30,
          cover_letter: "عرض تلقائي — شراء خدمة من السوق",
          status: "accepted" as any,
        });

        // Notify provider about the purchase and assignment
        await supabase.from("notifications").insert({
          user_id: providerId,
          message: `تم شراء خدمتك "${title}" وتعيينك على مشروع جديد — يرجى مراجعة العقد وتوقيعه`,
          type: "service_purchased_assigned",
          entity_id: project.id,
          entity_type: "project",
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
