import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendNotification } from "@/lib/notifications";

export function useAssociationTimeLogs(approvalFilter?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["time-logs", user?.id, approvalFilter],
    enabled: !!user,
    queryFn: async () => {
      const projectIds = (await supabase.from("projects").select("id").eq("association_id", user!.id)).data?.map(p => p.id) ?? [];
      if (!projectIds.length) return [];
      let query = supabase
        .from("time_logs")
        .select("*, projects(title), profiles:provider_id(full_name)")
        .in("project_id", projectIds)
        .order("log_date", { ascending: false });
      if (approvalFilter && approvalFilter !== "all") {
        query = query.eq("approval", approvalFilter as any);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateTimeLogApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approval, providerId }: { id: string; approval: "approved" | "rejected"; providerId: string }) => {
      const { error } = await supabase.from("time_logs").update({ approval }).eq("id", id);
      if (error) throw error;
      // Notify provider
      const msg = approval === "approved" ? "تمت الموافقة على ساعاتك المسجّلة" : "تم رفض ساعاتك المسجّلة";
      await sendNotification(providerId, msg, "time_log_approval");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-logs"] }),
  });
}
