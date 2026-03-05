import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const VAT_RATE = 0.15;

export interface PricingBreakdown {
  subtotal: number;
  commissionRate: number;
  commission: number;
  vat: number;
  total: number;
}

export function calculatePricing(baseAmount: number, commissionRate: number): PricingBreakdown {
  const commission = Math.round(baseAmount * commissionRate * 100) / 100;
  const vat = Math.round(commission * VAT_RATE * 100) / 100;
  const total = Math.round((baseAmount + commission + vat) * 100) / 100;
  return {
    subtotal: baseAmount,
    commissionRate,
    commission,
    vat,
    total,
  };
}

export function useCommissionRate() {
  return useQuery({
    queryKey: ["commission-rate"],
    queryFn: async () => {
      const { data } = await supabase
        .from("commission_config")
        .select("rate")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data?.rate as number) ?? 0.05;
    },
    staleTime: 5 * 60 * 1000,
  });
}
