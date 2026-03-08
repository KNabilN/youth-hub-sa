import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface GrantRequest {
  id: string;
  association_id: string;
  donor_id: string | null;
  project_id: string | null;
  amount: number;
  description: string;
  status: string;
  admin_note: string;
  created_at: string;
  updated_at: string;
  // joined
  association?: { full_name: string; organization_name: string | null; avatar_url: string | null };
  donor?: { full_name: string } | null;
  project?: { title: string } | null;
}

/** Association's own grant requests */
export function useMyGrants() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-my-grants-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "grant_requests" },
        () => {
          qc.invalidateQueries({ queryKey: ["my-grants"] });
          qc.invalidateQueries({ queryKey: ["assoc-pending-grants"] });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["my-grants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grant_requests" as any)
        .select("*, association:association_id(full_name, organization_name, avatar_url), donor:donor_id(full_name), project:project_id(title)")
        .eq("association_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as GrantRequest[];
    },
  });
}

/** Donor sees all general + targeted grant requests */
export function useGrantRequestsForDonor() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-grant-requests-donor-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "grant_requests" },
        () => {
          qc.invalidateQueries({ queryKey: ["grant-requests-donor"] });
          qc.invalidateQueries({ queryKey: ["my-grant-requests"] });
          qc.invalidateQueries({ queryKey: ["donor-pending-grant-requests"] });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["grant-requests-donor", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grant_requests" as any)
        .select("*, association:association_id(full_name, organization_name, avatar_url), project:project_id(title)")
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as GrantRequest[];
    },
  });
}

/** Donor sees only requests targeted to them */
export function useMyGrantRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-grant-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grant_requests" as any)
        .select("*, association:association_id(full_name, organization_name, avatar_url), project:project_id(title)")
        .eq("donor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as GrantRequest[];
    },
  });
}

/** Create a grant request */
export function useCreateGrantRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      association_id: string;
      donor_id?: string | null;
      project_id?: string | null;
      amount: number;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from("grant_requests" as any)
        .insert({
          association_id: values.association_id,
          donor_id: values.donor_id || null,
          project_id: values.project_id || null,
          amount: values.amount,
          description: values.description,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-grants"] });
      qc.invalidateQueries({ queryKey: ["grant-requests-donor"] });
      qc.invalidateQueries({ queryKey: ["my-grant-requests"] });
    },
  });
}

/** Verified donors list */
export function useVerifiedDonors() {
  return useQuery({
    queryKey: ["verified-donors"],
    queryFn: async () => {
      const { data: ids, error: rpcErr } = await supabase.rpc("get_verified_donor_ids" as any);
      if (rpcErr) throw rpcErr;
      if (!ids?.length) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, organization_name, avatar_url")
        .in("id", ids as string[]);
      if (error) throw error;
      return data;
    },
  });
}

/** Association's open projects (for linking to grant request) */
export function useAssociationProjects(associationId?: string) {
  return useQuery({
    queryKey: ["association-projects", associationId],
    enabled: !!associationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, budget, status")
        .eq("association_id", associationId!)
        .in("status", ["draft", "pending_approval", "open"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
