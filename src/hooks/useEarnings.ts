import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function useEarnings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime for escrow changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-earnings-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "escrow_transactions", filter: `payee_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["earnings"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["earnings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escrow_transactions")
        .select("*, projects(title, request_number, categories(name), regions(name)), payer:profiles!escrow_transactions_payer_id_fkey(full_name, organization_name)")
        .eq("payee_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
