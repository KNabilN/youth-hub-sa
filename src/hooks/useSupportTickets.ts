import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];

interface CreateTicketInput {
  subject: string;
  description: string;
  priority: TicketPriority;
}

export function useSupportTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["support-tickets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTicket() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets", user?.id] });
    },
  });
}
