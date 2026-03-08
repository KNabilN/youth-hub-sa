import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function useWithdrawals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime for withdrawal status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-withdrawals-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawal_requests", filter: `provider_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["withdrawals"] });
          qc.invalidateQueries({ queryKey: ["earnings"] });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*, profiles:provider_id(full_name, organization_name, bank_name, bank_iban, bank_account_holder)")
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
    mutationFn: async ({ amount, escrow_id }: { amount: number; escrow_id: string }) => {
      const { data: existing } = await supabase
        .from("withdrawal_requests")
        .select("id")
        .eq("escrow_id", escrow_id)
        .neq("status", "rejected")
        .maybeSingle();
      if (existing) throw new Error("يوجد طلب سحب مسبق لهذه المعاملة");

      const { data, error } = await supabase
        .from("withdrawal_requests")
        .insert({ provider_id: user!.id, amount, escrow_id } as any)
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("يوجد طلب سحب مسبق لهذه المعاملة");
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
      qc.invalidateQueries({ queryKey: ["earnings"] });
    },
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

      const enriched = await Promise.all(
        (data ?? []).map(async (w: any) => {
          if (!w.escrow_id) return w;
          const { data: escrow } = await supabase
            .from("escrow_transactions")
            .select("id, amount, status, escrow_number, project_id, service_id, projects:project_id(title, request_number), micro_services:service_id(title, service_number)")
            .eq("id", w.escrow_id)
            .single();
          return { ...w, escrow: escrow ?? null };
        })
      );
      return enriched;
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
      const { data: updated, error } = await supabase
        .from("withdrawal_requests")
        .update(updateData)
        .eq("id", id)
        .eq("status", "pending")
        .select("id");
      if (error) throw error;
      if (!updated?.length) throw new Error("تم معالجة هذا الطلب مسبقاً");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}
