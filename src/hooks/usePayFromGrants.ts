import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

      return escrow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["association-grant-balance"] });
      qc.invalidateQueries({ queryKey: ["association-received-grants"] });
      qc.invalidateQueries({ queryKey: ["association-grant-stats"] });
      qc.invalidateQueries({ queryKey: ["escrow"] });
    },
  });
}
