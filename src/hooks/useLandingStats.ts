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
      // Try featured first
      const { data: featured, error: e1 } = await supabase
        .from("micro_services")
        .select("id, title, description, price, service_type, image_url, approval, is_featured, sales_count, category:categories(name), region:regions(name), provider:profiles!micro_services_provider_id_fkey(full_name, organization_name)")
        .eq("approval", "approved")
        .eq("is_featured", true)
        .is("deleted_at", null)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(9);
      if (e1) throw e1;
      if (featured && featured.length > 0) return featured;

      // Fallback to display_order
      const { data, error } = await supabase
        .from("micro_services")
        .select("id, title, description, price, service_type, image_url, approval, category:categories(name), region:regions(name), provider:profiles!micro_services_provider_id_fkey(full_name, organization_name)")
        .eq("approval", "approved")
        .is("deleted_at", null)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(9);
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const projectsQuery = useQuery({
    queryKey: ["landing-featured-projects"],
    queryFn: async () => {
      // Try featured first
      const { data: featured, error: e1 } = await supabase
        .from("projects")
        .select("id, title, status, created_at, description, budget, required_skills, category:categories(name), association:profiles!projects_association_id_fkey(full_name, organization_name)")
        .eq("status", "open")
        .eq("is_private", false)
        .eq("is_featured", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(9);
      if (e1) throw e1;
      if (featured && featured.length > 0) return featured;

      // Fallback
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status, created_at, description, budget, required_skills, category:categories(name), association:profiles!projects_association_id_fkey(full_name, organization_name)")
        .eq("status", "open")
        .eq("is_private", false)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(9);
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
