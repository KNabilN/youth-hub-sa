import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCreateDispute() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ project_id, description }: { project_id: string; description: string }) => {
      const { error } = await supabase.from("disputes").insert({
        project_id,
        description,
        raised_by: user!.id,
        status: "open",
      });
      if (error) throw error;

      // Update project status to disputed
      await supabase.from("projects").update({ status: "disputed" }).eq("id", project_id);

      // Freeze held escrow for this project
      await supabase
        .from("escrow_transactions")
        .update({ status: "frozen" })
        .eq("project_id", project_id)
        .eq("status", "held");

      // DB triggers handle notifications (notify_on_dispute_change + notify_on_project_status_change + notify_on_escrow_change)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
  });
}

/** Re-open a resolved/closed dispute within grace period (7 days) */
export function useReopenDispute() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ disputeId, reason }: { disputeId: string; reason: string }) => {
      const { data: dispute, error: fetchErr } = await supabase
        .from("disputes")
        .select("id, status, updated_at, project_id, raised_by")
        .eq("id", disputeId)
        .single();
      if (fetchErr || !dispute) throw new Error("الشكوى غير موجودة");

      if (!["resolved", "closed"].includes(dispute.status)) {
        throw new Error("لا يمكن إعادة فتح شكوى بهذه الحالة");
      }

      const closedAt = new Date(dispute.updated_at);
      const now = new Date();
      const daysDiff = (now.getTime() - closedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7) {
        throw new Error("انتهت مهلة إعادة فتح الشكوى (7 أيام)");
      }

      const { error } = await supabase
        .from("disputes")
        .update({ status: "open", resolution_notes: `إعادة فتح: ${reason}` })
        .eq("id", disputeId);
      if (error) throw error;

      await supabase
        .from("escrow_transactions")
        .update({ status: "frozen" })
        .eq("project_id", dispute.project_id)
        .in("status", ["held", "released"]);

      await supabase
        .from("projects")
        .update({ status: "disputed" })
        .eq("id", dispute.project_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
      qc.invalidateQueries({ queryKey: ["admin-disputes"] });
      qc.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}
