import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function usePublicProfile(id: string | undefined) {
  // Increment views on mount
  useEffect(() => {
    if (id) {
      supabase.rpc("increment_profile_views", { p_id: id } as any).then(() => {}, () => {});
    }
  }, [id]);

  const profile = useQuery({
    queryKey: ["public-profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, cover_image_url, company_logo_url, organization_name, skills, qualifications, hourly_rate, is_verified, profile_views, license_number")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const role = useQuery({
    queryKey: ["public-profile-role", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", id!)
        .single();
      if (error) return null;
      return data?.role ?? null;
    },
  });

  const services = useQuery({
    queryKey: ["public-profile-services", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("*, categories(name)")
        .eq("provider_id", id!)
        .eq("approval", "approved");
      if (error) throw error;
      return data;
    },
  });

  const portfolio = useQuery({
    queryKey: ["public-profile-portfolio", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("provider_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const ratings = useQuery({
    queryKey: ["public-profile-ratings", id],
    enabled: !!id,
    queryFn: async () => {
      // Get contracts where the user is either provider or association
      const { data: contracts, error: cErr } = await supabase
        .from("contracts")
        .select("id")
        .or(`provider_id.eq.${id},association_id.eq.${id}`);
      if (cErr) throw cErr;
      if (!contracts?.length) return [];

      const contractIds = contracts.map((c) => c.id);
      const { data, error } = await supabase
        .from("ratings")
        .select("*, profiles:rater_id(full_name, avatar_url)")
        .in("contract_id", contractIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const savesCount = useQuery({
    queryKey: ["public-profile-saves-count", id],
    enabled: !!id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profile_saves")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", id!);
      if (error) throw error;
      return count ?? 0;
    },
  });

  return { profile, role, services, portfolio, ratings, savesCount };
}

export function useToggleProfileSave(profileId: string | undefined) {
  const { data: isSaved, refetch } = useQuery({
    queryKey: ["profile-save-status", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("profile_saves")
        .select("id")
        .eq("user_id", user.id)
        .eq("profile_id", profileId!)
        .maybeSingle();
      return !!data;
    },
  });

  const toggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profileId) return;

    if (isSaved) {
      await supabase
        .from("profile_saves")
        .delete()
        .eq("user_id", user.id)
        .eq("profile_id", profileId);
    } else {
      await supabase
        .from("profile_saves")
        .insert({ user_id: user.id, profile_id: profileId });
    }
    refetch();
  };

  return { isSaved: !!isSaved, toggle };
}
