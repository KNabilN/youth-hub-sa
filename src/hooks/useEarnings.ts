import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useEarnings() {
  const { user } = useAuth();
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
