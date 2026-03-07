import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EscrowStatus = Database["public"]["Enums"]["escrow_status"];

export function useEscrowTransactions() {
  return useQuery({
    queryKey: ["admin-escrow"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escrow_transactions")
        .select("*, projects(title), payer:profiles!escrow_transactions_payer_id_fkey(full_name, organization_name), payee:profiles!escrow_transactions_payee_id_fkey(full_name, organization_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateEscrowStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, receipt_url, expectedStatus }: { id: string; status: EscrowStatus; receipt_url?: string; expectedStatus?: EscrowStatus }) => {
      const update: Record<string, any> = { status };
      if (receipt_url) update.receipt_url = receipt_url;
      let query = supabase
        .from("escrow_transactions")
        .update(update)
        .eq("id", id);
      if (expectedStatus) {
        query = query.eq("status", expectedStatus);
      }
      const { data, error } = await query.select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("تم تعديل حالة الضمان مسبقاً من مكان آخر");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-escrow"] });
      qc.invalidateQueries({ queryKey: ["admin-finance-pending"] });
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, profiles!invoices_issued_to_fkey(full_name, organization_name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCommissionConfig() {
  return useQuery({
    queryKey: ["admin-commission"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_config")
        .select("*")
        .eq("is_active", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });
}

export function useUpdateCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rate, description }: { id: string; rate: number; description?: string }) => {
      const update: Record<string, any> = { rate };
      if (description !== undefined) update.description = description;
      const { error } = await supabase.from("commission_config").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-commission"] }),
  });
}
