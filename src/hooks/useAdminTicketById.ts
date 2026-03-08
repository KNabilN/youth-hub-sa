import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminTicketById(id: string | null) {
  return useQuery({
    queryKey: ["admin-ticket", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, profiles:user_id(full_name, avatar_url, organization_name)")
        .eq("id", id!)
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
