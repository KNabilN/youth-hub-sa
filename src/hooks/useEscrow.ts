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

      const { error } = await supabase
        .from("escrow_transactions")
        .update({ status: "released" } as any)
        .eq("id", escrow.id);
      if (error) throw error;
      return escrow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escrow"] }),
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
