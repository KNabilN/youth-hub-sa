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
      // Check if escrow already exists
      const { data: existing } = await supabase
        .from("escrow_transactions")
        .select("id")
        .eq("project_id", projectId)
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
      const { data: escrow, error: fetchErr } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "held")
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!escrow) throw new Error("No held escrow found");

      // Get active commission rate to calculate net amount
      const { data: config } = await supabase
        .from("commission_config")
        .select("rate")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const rate = config?.rate ?? 0.05;
      const commissionAmount = Number(escrow.amount) * Number(rate);
      const netAmount = Number(escrow.amount) - commissionAmount;

      const { error } = await supabase
        .from("escrow_transactions")
        .update({ status: "released", amount: netAmount } as any)
        .eq("id", escrow.id);
      if (error) throw error;

      // Return original amount info for invoice generation
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
      const { error } = await supabase
        .from("escrow_transactions")
        .update({ status: "refunded" } as any)
        .eq("project_id", projectId)
        .eq("status", "held");
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escrow"] }),
  });
}
