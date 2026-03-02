import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";
import type { Database } from "@/integrations/supabase/types";

type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

export function useAdminServices() {
  return useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("*, categories(name), regions(name), cities(name), profiles!micro_services_provider_id_fkey(full_name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateServiceApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approval, providerId }: { id: string; approval: ApprovalStatus; providerId: string }) => {
      const { error } = await supabase.from("micro_services").update({ approval }).eq("id", id);
      if (error) throw error;
      const msg = approval === "approved" ? "تمت الموافقة على خدمتك" : "تم رفض خدمتك";
      await sendNotification(providerId, msg, "service_approval");
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
