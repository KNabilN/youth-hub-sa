import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const INVOICES_LAST_SEEN_KEY = "admin_invoices_last_seen";

export function getInvoicesLastSeen(): string {
  return localStorage.getItem(INVOICES_LAST_SEEN_KEY) || "1970-01-01T00:00:00Z";
}

export function markInvoicesSeen() {
  localStorage.setItem(INVOICES_LAST_SEEN_KEY, new Date().toISOString());
}

export function useAdminFinancePending() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["admin-finance-pending"],
    queryFn: async () => {
      const lastSeen = getInvoicesLastSeen();

      const [escrowRes, withdrawalRes, transferRes, invoiceRes] = await Promise.all([
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
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gt("created_at", lastSeen),
      ]);

      const escrow = escrowRes.count ?? 0;
      const withdrawals = withdrawalRes.count ?? 0;
      const bankTransfers = transferRes.count ?? 0;
      const invoices = invoiceRes.count ?? 0;

      return {
        escrow,
        withdrawals,
        bankTransfers,
        invoices,
        total: escrow + withdrawals + bankTransfers,
      };
    },
    enabled: !!user && role === "super_admin",
  });
}
