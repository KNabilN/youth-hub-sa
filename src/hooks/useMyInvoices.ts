import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useMyInvoices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-invoices", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, escrow_transactions(project_id, service_id, grant_request_id, projects:project_id(title), micro_services:service_id(title))")
        .eq("issued_to", user!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
