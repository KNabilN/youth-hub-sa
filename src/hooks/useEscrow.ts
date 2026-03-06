import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCreateEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      payerId,
      payeeId,
      amount,
    }: {
      projectId: string;
      payerId: string;
      payeeId: string;
      amount: number;
    }) => {
      // Check for existing ACTIVE escrow (exclude dead states)
      const { data: existing } = await supabase
        .from("escrow_transactions")
        .select("id")
        .eq("project_id", projectId)
        .in("status", ["held", "released", "pending_payment", "frozen"] as any)
        .maybeSingle();
      if (existing) return existing;

      const { data, error } = await supabase
        .from("escrow_transactions")
        .insert({
          project_id: projectId,
          payer_id: payerId,
          payee_id: payeeId,
          amount,
          status: "held",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escrow"] }),
  });
}

export function useReleaseEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      // Optimistic lock: update only if status is still 'held'
      const { data: escrows, error: fetchErr } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "held")
        .order("created_at", { ascending: false })
        .limit(1);
      if (fetchErr) throw fetchErr;
      const escrow = escrows?.[0];
      if (!escrow) throw new Error("No held escrow found");

      // Atomic update with status check (optimistic lock)
      const { data: updated, error } = await supabase
        .from("escrow_transactions")
        .update({ status: "released" } as any)
        .eq("id", escrow.id)
        .eq("status", "held")
        .select("id")
        .single();
      if (error) throw error;
      if (!updated) throw new Error("Escrow status changed concurrently — release aborted");

      // Get active commission rate
      const { data: config } = await supabase
        .from("commission_config")
        .select("rate")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const rate = config?.rate ?? 0.05;
      const commissionAmount = Number(escrow.amount) * Number(rate);
      const netAmount = Number(escrow.amount);

      return { ...escrow, net_amount: netAmount, commission_amount: commissionAmount };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["earnings"] });
      qc.invalidateQueries({ queryKey: ["provider-stats"] });
    },
  });
}

export function useRefundEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      // Optimistic lock: only refund if still held
      const { data: updated, error } = await supabase
        .from("escrow_transactions")
        .update({ status: "refunded" } as any)
        .eq("project_id", projectId)
        .eq("status", "held")
        .select("id");
      if (error) throw error;
      if (!updated?.length) throw new Error("No held escrow to refund");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escrow"] }),
  });
}
