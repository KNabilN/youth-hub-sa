import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function useServiceDetail(id: string | undefined) {
  // Increment views on mount
  useEffect(() => {
    if (!id) return;
    supabase.rpc("increment_service_views", { s_id: id });
  }, [id]);

  const serviceQuery = useQuery({
    queryKey: ["service-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("*, categories(*), regions(*), profiles!micro_services_provider_id_fkey(id, full_name, avatar_url, bio, skills, is_verified, profile_views)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const ratingsQuery = useQuery({
    queryKey: ["service-ratings", id],
    enabled: !!id && !!serviceQuery.data,
    queryFn: async () => {
      const providerId = serviceQuery.data?.provider_id;
      if (!providerId) return [];
      // Get ratings for contracts where the provider was involved
      const { data, error } = await supabase
        .from("ratings")
        .select("*, contracts!inner(provider_id, project_id, projects:project_id(title)), profiles:rater_id(full_name, avatar_url)")
        .eq("contracts.provider_id", providerId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  return {
    service: serviceQuery.data,
    isLoading: serviceQuery.isLoading,
    error: serviceQuery.error,
    ratings: ratingsQuery.data ?? [],
    ratingsLoading: ratingsQuery.isLoading,
  };
}
