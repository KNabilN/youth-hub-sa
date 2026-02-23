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
    }: {
      serviceId: string;
      providerId: string;
      buyerId: string;
      amount: number;
    }) => {
      // Create escrow transaction
      const { data: escrow, error: escrowErr } = await supabase
        .from("escrow_transactions")
        .insert({
          service_id: serviceId,
          payer_id: buyerId,
          payee_id: providerId,
          amount,
          status: "held",
        })
        .select()
        .single();
      if (escrowErr) throw escrowErr;

      // Notify provider
      await supabase.from("notifications").insert({
        user_id: providerId,
        message: `تم شراء خدمتك بمبلغ ${amount} ر.س`,
        type: "purchase",
      });

      return escrow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
}
