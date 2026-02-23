import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${date}-${rand}`;
}

export function useGenerateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      escrowId,
      amount,
      issuedTo,
    }: {
      escrowId: string;
      amount: number;
      issuedTo: string;
    }) => {
      // Get active commission rate
      const { data: config } = await supabase
        .from("commission_config")
        .select("rate")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const rate = config?.rate ?? 0.05;
      const commissionAmount = amount * rate;

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          invoice_number: generateInvoiceNumber(),
          amount,
          commission_amount: commissionAmount,
          issued_to: issuedTo,
          escrow_id: escrowId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}
