import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";

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
              status: "draft" as any, // pending_payment — will move to in_progress after contract signing
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
        .select("*, profiles:user_id(full_name), escrow_transactions:escrow_id(payer_id, payee_id, project_id, amount, service_id, projects:project_id(title), micro_services:service_id(title))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${date}-${rand}`;
}

export function useApproveBankTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ transferId, escrowId }: { transferId: string; escrowId: string }) => {
      // 1. Update bank_transfer status
      const { error: btErr } = await supabase
        .from("bank_transfers")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", transferId);
      if (btErr) throw btErr;

      // 2. Update escrow to held
      const { error: escErr } = await supabase
        .from("escrow_transactions")
        .update({ status: "held" as any })
        .eq("id", escrowId);
      if (escErr) throw escErr;

      // 3. Fetch escrow details
      const { data: escrow } = await supabase
        .from("escrow_transactions")
        .select("payer_id, payee_id, project_id, amount, service_id")
        .eq("id", escrowId)
        .single();
      if (!escrow) return;

      // 4. Generate invoice
      const { data: config } = await supabase
        .from("commission_config")
        .select("rate")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const rate = config?.rate ?? 0.05;
      const commissionAmount = Number(escrow.amount) * Number(rate);

      await supabase.from("invoices").insert({
        invoice_number: generateInvoiceNumber(),
        amount: escrow.amount,
        commission_amount: commissionAmount,
        issued_to: escrow.payer_id,
        escrow_id: escrowId,
      });

      // 5. Create contract if project exists
      if (escrow.project_id) {
        // Get service title for contract terms
        let serviceTitle = "خدمة";
        if (escrow.service_id) {
          const { data: svc } = await supabase
            .from("micro_services")
            .select("title")
            .eq("id", escrow.service_id)
            .single();
          if (svc) serviceTitle = svc.title;
        }

        const terms = `عقد تنفيذ خدمة "${serviceTitle}" — المبلغ المتفق عليه: ${Number(escrow.amount).toLocaleString()} ر.س. يلتزم مقدم الخدمة بتنفيذ الخدمة وفق الوصف المتفق عليه، ويلتزم الطرف الأول بالدفع عبر نظام الضمان المالي.`;

        // Check if contract already exists
        const { data: existingContract } = await supabase
          .from("contracts")
          .select("id")
          .eq("project_id", escrow.project_id)
          .maybeSingle();

        if (!existingContract) {
          await supabase.from("contracts").insert({
            project_id: escrow.project_id,
            association_id: escrow.payer_id,
            provider_id: escrow.payee_id,
            terms,
            association_signed_at: new Date().toISOString(), // Auto-sign for payer (association/donor)
          });
          // DB trigger notify_on_contract_change handles notifications to both parties
        }
      }

      // 6. Notifications are handled by DB triggers (bank_transfer_approved + contract_created)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bank-transfers"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["admin-escrow"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["my-invoices"] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
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

      // Notifications handled by DB trigger notify_on_bank_transfer_change
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bank-transfers"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["admin-escrow"] });
    },
  });
}
