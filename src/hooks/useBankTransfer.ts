import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCreateBankTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      receiptFile,
      amount,
      userId,
      items,
      beneficiaryId,
    }: {
      receiptFile: File;
      amount: number;
      userId: string;
      items: Array<{ serviceId: string; providerId: string; price: number; title?: string }>;
      beneficiaryId?: string;
    }) => {
      // Upload receipt
      const filePath = `${userId}/${Date.now()}_${receiptFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("transfer-receipts")
        .upload(filePath, receiptFile);
      if (uploadErr) throw uploadErr;

      // Create escrow transactions for each item with pending_payment status
      const escrowIds: string[] = [];
      for (const item of items) {
        // Create project if beneficiary selected
        let projectId: string | null = null;
        if (beneficiaryId) {
          const title = item.title || "خدمة ممولة من مانح";
          const { data: project, error: projErr } = await supabase
            .from("projects")
            .insert({
              title,
              description: `خدمة ممولة تلقائياً من مانح — ${title}`,
              association_id: beneficiaryId,
              assigned_provider_id: item.providerId,
              status: "in_progress" as any,
              budget: item.price,
              is_private: true,
            })
            .select("id")
            .single();
          if (projErr) throw projErr;
          projectId = project.id;

          await supabase.from("notifications").insert({
            user_id: beneficiaryId,
            message: `قام مانح بتمويل خدمة "${title}" لصالح جمعيتكم`,
            type: "donor_funded_service",
          });
        }

        const { data: escrow, error: escrowErr } = await supabase
          .from("escrow_transactions")
          .insert({
            service_id: item.serviceId,
            payer_id: userId,
            payee_id: item.providerId,
            amount: item.price,
            status: "pending_payment" as any,
            project_id: projectId,
            beneficiary_id: beneficiaryId || null,
          } as any)
          .select()
          .single();
        if (escrowErr) throw escrowErr;
        escrowIds.push(escrow.id);
      }

      // Create bank_transfer records for each escrow
      for (const escrowId of escrowIds) {
        const { error: btErr } = await supabase
          .from("bank_transfers" as any)
          .insert({
            escrow_id: escrowId,
            user_id: userId,
            receipt_url: filePath,
            amount,
            status: "pending",
          } as any);
        if (btErr) throw btErr;
      }

      // Also create donor_contributions records
      for (const item of items) {
        await supabase.from("donor_contributions").insert({
          donor_id: userId,
          service_id: item.serviceId,
          association_id: beneficiaryId || null,
          amount: item.price,
          donation_status: "pending",
        });
      }

      // Admin notifications are handled by the database trigger automatically

      return { escrowIds };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["bank-transfers"] });
    },
  });
}

export function useAdminBankTransfers() {
  return useQuery({
    queryKey: ["admin-bank-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_transfers")
        .select("*, profiles:user_id(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useApproveBankTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ transferId, escrowId }: { transferId: string; escrowId: string }) => {
      // Update bank_transfer status
      const { error: btErr } = await supabase
        .from("bank_transfers")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", transferId);
      if (btErr) throw btErr;

      // Update escrow to held
      const { error: escErr } = await supabase
        .from("escrow_transactions")
        .update({ status: "held" as any })
        .eq("id", escrowId);
      if (escErr) throw escErr;

      // Send notification to the payer
      const { data: escrow } = await supabase
        .from("escrow_transactions")
        .select("payer_id")
        .eq("id", escrowId)
        .single();
      if (escrow?.payer_id) {
        await supabase.from("notifications").insert({
          user_id: escrow.payer_id,
          message: "تمت الموافقة على التحويل البنكي الخاص بك وتم حجز المبلغ في الضمان المالي",
          type: "bank_transfer_approved",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bank-transfers"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["admin-escrow"] });
    },
  });
}

export function useRejectBankTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transferId,
      escrowId,
      adminNote,
    }: {
      transferId: string;
      escrowId: string;
      adminNote?: string;
    }) => {
      const { error: btErr } = await supabase
        .from("bank_transfers")
        .update({
          status: "rejected",
          admin_note: adminNote || "",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", transferId);
      if (btErr) throw btErr;

      const { error: escErr } = await supabase
        .from("escrow_transactions")
        .update({ status: "failed" as any })
        .eq("id", escrowId);
      if (escErr) throw escErr;

      // Send rejection notification to payer
      const { data: escrow } = await supabase
        .from("escrow_transactions")
        .select("payer_id")
        .eq("id", escrowId)
        .single();
      if (escrow?.payer_id) {
        const reason = adminNote ? `: ${adminNote}` : "";
        await supabase.from("notifications").insert({
          user_id: escrow.payer_id,
          message: `تم رفض التحويل البنكي الخاص بك${reason}. يرجى التواصل مع الدعم أو إعادة المحاولة.`,
          type: "bank_transfer_rejected",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bank-transfers"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["admin-escrow"] });
    },
  });
}
