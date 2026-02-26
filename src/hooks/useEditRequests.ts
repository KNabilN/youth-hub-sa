import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendNotification } from "@/lib/notifications";

export interface EditRequest {
  id: string;
  target_table: string;
  target_id: string;
  requested_by: string;
  target_user_id: string;
  requested_changes: Record<string, any>;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const targetTableLabels: Record<string, string> = {
  micro_services: "خدمة",
  projects: "طلب جمعية",
  profiles: "ملف شخصي",
};

export function useMyEditRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["edit-requests", "mine", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edit_requests" as any)
        .select("*")
        .eq("target_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EditRequest[];
    },
  });
}

export function usePendingEditRequestsCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["edit-requests", "pending-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("edit_requests" as any)
        .select("*", { count: "exact", head: true })
        .eq("target_user_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useCreateEditRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      target_table: string;
      target_id: string;
      target_user_id: string;
      requested_changes: Record<string, any>;
      message?: string;
      requested_by: string;
    }) => {
      const { error } = await supabase.from("edit_requests" as any).insert({
        target_table: input.target_table,
        target_id: input.target_id,
        target_user_id: input.target_user_id,
        requested_by: input.requested_by,
        requested_changes: input.requested_changes,
        message: input.message || "",
      } as any);
      if (error) throw error;

      const label = targetTableLabels[input.target_table] || input.target_table;
      await sendNotification(
        input.target_user_id,
        `لديك طلب تعديل من المدير على ${label}`,
        "edit_request"
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edit-requests"] }),
  });
}

export function useAcceptEditRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: EditRequest) => {
      // Apply changes to target table
      const { error: updateError } = await supabase
        .from(req.target_table as any)
        .update(req.requested_changes as any)
        .eq("id", req.target_id);
      if (updateError) throw updateError;

      // Mark request as accepted
      const { error } = await supabase
        .from("edit_requests" as any)
        .update({ status: "accepted", updated_at: new Date().toISOString() } as any)
        .eq("id", req.id);
      if (error) throw error;

      const label = targetTableLabels[req.target_table] || req.target_table;
      await sendNotification(
        req.requested_by,
        `تم قبول طلب التعديل على ${label}`,
        "edit_request"
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edit-requests"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useRejectEditRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: EditRequest) => {
      // Mark request as rejected
      const { error } = await supabase
        .from("edit_requests" as any)
        .update({ status: "rejected", updated_at: new Date().toISOString() } as any)
        .eq("id", req.id);
      if (error) throw error;

      // Set target item to pending status
      if (req.target_table === "micro_services") {
        await supabase
          .from("micro_services")
          .update({ approval: "pending" })
          .eq("id", req.target_id);
      } else if (req.target_table === "projects") {
        await supabase
          .from("projects")
          .update({ status: "pending_approval" })
          .eq("id", req.target_id);
      }

      const label = targetTableLabels[req.target_table] || req.target_table;
      await sendNotification(
        req.requested_by,
        `تم رفض طلب التعديل على ${label} - تم تعليقه`,
        "edit_request"
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edit-requests"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}
