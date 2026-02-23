import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreateContributionInput {
  amount: number;
  project_id?: string;
  service_id?: string;
}

export function useDonorContributions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["donor-contributions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("*, projects(title), micro_services(title)")
        .eq("donor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateContribution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateContributionInput) => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .insert({ ...input, donor_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donor-contributions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["donor-stats", user?.id] });
    },
  });
}
