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

      // Create bank_transfer records for each escrow with per-item amount
      for (let i = 0; i < escrowIds.length; i++) {
        const { error: btErr } = await supabase
          .from("bank_transfers" as any)
          .insert({
            escrow_id: escrowIds[i],
            user_id: userId,
            receipt_url: filePath,
            amount: items[i].price,
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

      // 3. Fetch escrow details (including grant_request_id)
      const { data: escrow } = await supabase
        .from("escrow_transactions")
        .select("payer_id, payee_id, beneficiary_id, project_id, amount, service_id, grant_request_id")
        .eq("id", escrowId)
        .single();
      if (!escrow) return;

      // Get commission rate
      const { data: config } = await supabase
        .from("commission_config")
        .select("rate")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const rate = config?.rate ?? 0.05;
      const commissionAmount = Number(escrow.amount) * Number(rate);

      // Update donor_contributions status to available
      const { data: bt } = await supabase
        .from("bank_transfers")
        .select("user_id")
        .eq("id", transferId)
        .single();

      if (bt) {
        await supabase
          .from("donor_contributions")
          .update({ donation_status: "available" })
          .eq("donor_id", bt.user_id)
          .eq("donation_status", "pending")
          .eq("amount", escrow.amount);
      }

      // Update linked grant_request to 'funded' using direct grant_request_id
      if ((escrow as any).grant_request_id) {
        await supabase
          .from("grant_requests" as any)
          .update({ status: "funded", updated_at: new Date().toISOString() } as any)
          .eq("id", (escrow as any).grant_request_id);
      }

      if (!escrow.project_id) {
        // === Scenario 1: General donation to association (no project_id) ===
        // Issue invoice to the association (beneficiary)
        const issuedTo = escrow.beneficiary_id || escrow.payee_id;
        await supabase.from("invoices").insert({
          invoice_number: generateInvoiceNumber(),
          amount: escrow.amount,
          commission_amount: commissionAmount,
          issued_to: issuedTo,
          escrow_id: escrowId,
          notes: "فاتورة منحة موجهة للجمعية",
        });

        // Notify association
        await sendNotification(
          issuedTo,
          `تم استلام منحة بمبلغ ${Number(escrow.amount).toLocaleString()} ر.س وتم إصدار الفاتورة`,
          "donation_approved"
        );
      } else {
        // === Scenario 2: Donation to specific project request ===
        // Issue receipt invoice to the donor (payer)
        await supabase.from("invoices").insert({
          invoice_number: generateInvoiceNumber(),
          amount: escrow.amount,
          commission_amount: commissionAmount,
          issued_to: escrow.payer_id,
          escrow_id: escrowId,
          notes: "فاتورة استلام منحة لطلب جمعية",
        });

        // Send thank-you notification to donor
        await sendNotification(
          escrow.payer_id,
          `شكراً لمنحتك الكريمة بمبلغ ${Number(escrow.amount).toLocaleString()} ر.س — تم إصدار فاتورة الاستلام`,
          "donation_thankyou"
        );

        // Get project details for contract
        const { data: project } = await supabase
          .from("projects")
          .select("title, association_id, assigned_provider_id")
          .eq("id", escrow.project_id)
          .single();

        if (project && project.assigned_provider_id) {
          // Get service title if applicable
          let serviceTitle = project.title || "خدمة";
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
              association_id: project.association_id,
              provider_id: project.assigned_provider_id,
              terms,
              association_signed_at: new Date().toISOString(),
            });
            // DB trigger notify_on_contract_change handles notifications
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bank-transfers"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["admin-escrow"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["my-invoices"] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["donor-contributions"] });
      qc.invalidateQueries({ queryKey: ["my-grants"] });
      qc.invalidateQueries({ queryKey: ["grant-requests-donor"] });
      qc.invalidateQueries({ queryKey: ["my-grant-requests"] });
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

      // Update donor_contributions to rejected
      const { data: bt } = await supabase
        .from("bank_transfers")
        .select("user_id, amount")
        .eq("id", transferId)
        .single();

      if (bt) {
        await supabase
          .from("donor_contributions")
          .update({ donation_status: "rejected" })
          .eq("donor_id", bt.user_id)
          .eq("donation_status", "pending")
          .eq("amount", bt.amount);
      }

      // Notifications handled by DB trigger notify_on_bank_transfer_change
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bank-transfers"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["admin-escrow"] });
      qc.invalidateQueries({ queryKey: ["donor-contributions"] });
    },
  });
}
