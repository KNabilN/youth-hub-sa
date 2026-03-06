import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${date}-${rand}`;
}

interface PayFromGrantsInput {
  amount: number;
  payeeId: string;
  projectId?: string;
  serviceId?: string;
}

export function usePayFromGrants() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, payeeId, projectId, serviceId }: PayFromGrantsInput) => {
      if (!user) throw new Error("Not authenticated");

      // 1. Get available contributions for this association, oldest first
      const { data: contributions, error: fetchErr } = await supabase
        .from("donor_contributions")
        .select("id, amount, donation_status")
        .eq("association_id", user.id)
        .eq("donation_status", "available")
        .order("created_at", { ascending: true });
      if (fetchErr) throw fetchErr;

      const available = (contributions ?? []).reduce((s, c) => s + Number(c.amount), 0);
      if (available < amount) throw new Error("رصيد المنح غير كافٍ");

      // 2. Mark contributions as consumed (FIFO)
      let remaining = amount;
      for (const c of contributions ?? []) {
        if (remaining <= 0) break;
        remaining -= Number(c.amount);
        const { error } = await supabase
          .from("donor_contributions")
          .update({ donation_status: "consumed" })
          .eq("id", c.id);
        if (error) throw error;
      }

      // 3. Create escrow with status 'held'
      const { data: escrow, error: escrowErr } = await supabase
        .from("escrow_transactions")
        .insert({
          payer_id: user.id,
          payee_id: payeeId,
          amount,
          status: "held",
          project_id: projectId || null,
          service_id: serviceId || null,
        })
        .select()
        .single();
      if (escrowErr) throw escrowErr;

      // 4. Get active commission rate and create invoice
      const { data: config } = await supabase
        .from("commission_config")
        .select("rate")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const rate = config?.rate ?? 0.05;
      const commissionAmount = Math.round(amount * Number(rate) * 100) / 100;

      const { error: invError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: generateInvoiceNumber(),
          amount,
          commission_amount: commissionAmount,
          issued_to: user.id,
          escrow_id: escrow.id,
        });
      if (invError) throw invError;

      return escrow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["association-grant-balance"] });
      qc.invalidateQueries({ queryKey: ["association-received-grants"] });
      qc.invalidateQueries({ queryKey: ["association-grant-stats"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["my-invoices"] });
    },
  });
}
