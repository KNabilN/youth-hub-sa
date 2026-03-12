import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";
import { translateError } from "@/lib/auth-errors";

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

export function useDeliverables(projectId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`rt-deliverables-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_deliverables", filter: `project_id=eq.${projectId}` },
        () => qc.invalidateQueries({ queryKey: ["deliverables", projectId] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, qc]);

  return useQuery({
    queryKey: ["deliverables", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("project_deliverables")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Deliverable[];
    },
  });
}

export function useDeliverable(projectId: string | undefined) {
  const query = useDeliverables(projectId);
  return {
    ...query,
    data: query.data?.[0] ?? null,
  };
}

export function useSubmitDeliverable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, notes }: { projectId: string; notes: string }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");
      const { error } = await (supabase as any)
        .from("project_deliverables")
        .insert({
          project_id: projectId,
          provider_id: user.id,
          notes,
          status: "pending_review",
        } as any);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", variables.projectId] });
      toast.success("تم تقديم التسليمات للمراجعة");
    },
    onError: (err: Error) => {
      toast.error(translateError(err.message || "حدث خطأ"));
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
      queryClient.invalidateQueries({ queryKey: ["deliverables", variables.projectId] });
      toast.success(variables.action === "accepted" ? "تم قبول التسليمات" : "تم طلب التعديلات");
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });
}
