import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import type { Database } from "@/integrations/supabase/types";

type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

export function useAdminServices() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("rt-admin-services")
      .on("postgres_changes", { event: "*", schema: "public", table: "micro_services" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-services"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("*, categories(name), regions(name), cities(name), profiles!micro_services_provider_id_fkey(full_name, organization_name)")
        .is("deleted_at", null)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateServiceApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approval, rejection_reason }: { id: string; approval: ApprovalStatus; providerId: string; rejection_reason?: string }) => {
      const updates: any = { approval };
      if (rejection_reason !== undefined) updates.rejection_reason = rejection_reason;
      if (approval !== 'rejected') updates.rejection_reason = null;
      const { error } = await supabase.from("micro_services").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  });
}

export function useAdminUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("micro_services").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  });
}

export function useAdminDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("micro_services")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  });
}
