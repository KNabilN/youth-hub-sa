import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Deliverable {
  id: string;
  project_id: string;
  provider_id: string;
  status: "pending_review" | "accepted" | "revision_requested";
  notes: string;
  reviewed_at: string | null;
  revision_note: string;
  created_at: string;
  updated_at: string;
}

export function useDeliverable(projectId: string | undefined) {
  return useQuery({
    queryKey: ["deliverable", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("project_deliverables")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Deliverable | null;
    },
  });
}

export function useSubmitDeliverable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, notes }: { projectId: string; notes: string }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      // Check if there's an existing deliverable to update
      const { data: existing } = await (supabase as any)
        .from("project_deliverables")
        .select("id")
        .eq("project_id", projectId)
        .eq("provider_id", user.id)
        .maybeSingle();

      if (existing) {
        // Re-submit after revision
        const { error } = await (supabase as any)
          .from("project_deliverables")
          .update({
            status: "pending_review",
            notes,
            revision_note: "",
            reviewed_at: null,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("project_deliverables")
          .insert({
            project_id: projectId,
            provider_id: user.id,
            notes,
            status: "pending_review",
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deliverable", variables.projectId] });
      toast.success("تم تقديم التسليمات للمراجعة");
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ");
    },
  });
}

export function useReviewDeliverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      deliverableId,
      projectId,
      action,
      revisionNote,
    }: {
      deliverableId: string;
      projectId: string;
      action: "accepted" | "revision_requested";
      revisionNote?: string;
    }) => {
      const { error } = await (supabase as any)
        .from("project_deliverables")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          revision_note: action === "revision_requested" ? revisionNote || "" : "",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", deliverableId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deliverable", variables.projectId] });
      toast.success(variables.action === "accepted" ? "تم قبول التسليمات" : "تم طلب التعديلات");
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });
}
