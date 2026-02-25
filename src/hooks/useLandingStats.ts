import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLandingStats() {
  const statsQuery = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_landing_stats");
      if (error) throw error;
      return data as {
        providers: number;
        associations: number;
        completed_projects: number;
        approved_services: number;
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const servicesQuery = useQuery({
    queryKey: ["landing-featured-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("id, title, description, price, service_type, image_url, category:categories(name), region:regions(name), provider:profiles!micro_services_provider_id_fkey(full_name)")
        .eq("approval", "approved")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const projectsQuery = useQuery({
    queryKey: ["landing-featured-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, budget, required_skills, association:profiles!projects_association_id_fkey(full_name, organization_name)")
        .eq("status", "open")
        .eq("is_private", false)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    services: servicesQuery.data || [],
    servicesLoading: servicesQuery.isLoading,
    projects: projectsQuery.data || [],
    projectsLoading: projectsQuery.isLoading,
  };
}
