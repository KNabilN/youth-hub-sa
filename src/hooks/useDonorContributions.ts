import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreateContributionInput {
  amount: number;
  project_id?: string;
  service_id?: string;
  association_id?: string;
  donation_status?: string;
}

export function useDonorContributions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["donor-contributions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("*, projects(title, status), micro_services(title), profiles:association_id(full_name, organization_name)")
        .eq("donor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useDonorConsumedBreakdown() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["donor-consumed-breakdown", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select(`
          id, amount, created_at, donation_status, project_id, service_id, association_id,
          projects(title, status, assigned_provider_id, request_number),
          micro_services(title, service_number, provider_id),
          profiles:association_id(full_name, organization_name)
        `)
        .eq("donor_id", user!.id)
        .eq("donation_status", "consumed")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch provider names for projects and services
      const providerIds = new Set<string>();
      for (const c of data ?? []) {
        const proj = c.projects as any;
        const svc = c.micro_services as any;
        if (proj?.assigned_provider_id) providerIds.add(proj.assigned_provider_id);
        if (svc?.provider_id) providerIds.add(svc.provider_id);
      }

      let providerMap: Record<string, string> = {};
      if (providerIds.size > 0) {
        const { data: providers } = await supabase
          .from("profiles")
          .select("id, full_name, organization_name")
          .in("id", Array.from(providerIds));
        for (const p of providers ?? []) {
          providerMap[p.id] = p.organization_name || p.full_name || "";
        }
      }

      return (data ?? []).map((c: any) => ({
        ...c,
        provider_name: c.projects?.assigned_provider_id
          ? providerMap[c.projects.assigned_provider_id]
          : c.micro_services?.provider_id
            ? providerMap[c.micro_services.provider_id]
            : null,
      }));
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
      queryClient.invalidateQueries({ queryKey: ["donor-balances", user?.id] });
    },
  });
}
