import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useWithdrawals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .insert({ provider_id: user!.id, amount })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["withdrawals"] }),
  });
}

export function useAllWithdrawals() {
  return useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*, profiles:provider_id(full_name, organization_name, bank_name, bank_iban, bank_account_holder)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateWithdrawalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, receipt_url, rejection_reason }: { id: string; status: string; receipt_url?: string; rejection_reason?: string }) => {
      const updateData: Record<string, any> = { status, processed_at: new Date().toISOString() };
      if (receipt_url) updateData.receipt_url = receipt_url;
      if (rejection_reason) updateData.rejection_reason = rejection_reason;
      const { error } = await supabase
        .from("withdrawal_requests")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}
