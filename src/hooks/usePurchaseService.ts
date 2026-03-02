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
      // Create escrow transaction (triggers handle notifications automatically)
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

      // Also create donor_contributions record
      await supabase.from("donor_contributions").insert({
        donor_id: buyerId,
        service_id: serviceId,
        amount,
      });

      return escrow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escrow"] });
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      qc.invalidateQueries({ queryKey: ["donor-contributions"] });
    },
  });
}
