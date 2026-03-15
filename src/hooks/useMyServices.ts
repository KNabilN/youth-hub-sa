import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { sanitizeFormValues, SERVICE_UUID_FIELDS, SERVICE_NUMERIC_FIELDS } from "@/lib/sanitize";

export function useMyServices(approvalFilter?: string, sortBy?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime subscription for service approval changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-my-services-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "micro_services", filter: `provider_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["my-services"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["my-services", user?.id, approvalFilter, sortBy],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("micro_services")
        .select("*, categories(*), regions(*), cities(*)")
        .eq("provider_id", user!.id)
        .is("deleted_at", null);

      if (approvalFilter && approvalFilter !== "all") {
        query = query.eq("approval", approvalFilter as any);
      }

      if (sortBy === "sales") {
        query = query.order("sales_count", { ascending: false, nullsFirst: false });
      } else if (sortBy === "views") {
        query = query.order("service_views", { ascending: false, nullsFirst: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<"micro_services">, "provider_id">) => {
      const { data, error } = await supabase
        .from("micro_services")
        .insert({ ...values, provider_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-services"] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: TablesUpdate<"micro_services"> & { id: string }) => {
      const { data, error } = await supabase
        .from("micro_services")
        .update({ ...values, approval: "pending" as const })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("micro_services")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-services"] }),
  });
}

export function useUpdateServiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approval }: { id: string; approval: "draft" | "pending" | "suspended" | "archived" }) => {
      const { error } = await supabase.from("micro_services").update({ approval }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-services"] }),
  });
}
