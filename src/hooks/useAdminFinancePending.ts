import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdminFinancePending() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["admin-finance-pending"],
    queryFn: async () => {
      const [escrowRes, withdrawalRes, transferRes] = await Promise.all([
        supabase
          .from("escrow_transactions")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending_payment", "under_review"]),
        supabase
          .from("withdrawal_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("bank_transfers")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      const escrow = escrowRes.count ?? 0;
      const withdrawals = withdrawalRes.count ?? 0;
      const bankTransfers = transferRes.count ?? 0;

      return {
        escrow,
        withdrawals,
        bankTransfers,
        total: escrow + withdrawals + bankTransfers,
      };
    },
    enabled: !!user && role === "super_admin",
  });
}
