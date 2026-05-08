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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_deliverables",
          filter: `project_id=eq.${projectId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["deliverables", projectId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
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
    mutationFn: async ({
      projectId,
      notes,
    }: {
      projectId: string;
      notes: string;
    }) => {
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
      queryClient.invalidateQueries({
        queryKey: ["deliverables", variables.projectId],
      });
      toast.success("تم إرسال التسليم بنجاح", {
        description: "وصل العمل للجمعية وهي الآن بانتظار المراجعة",
      });
    },
    onError: (err: Error) => {
      toast.error(translateError(err.message || "حدث خطأ"));
    },
  });
}

export interface ProviderDeliverableAlert {
  project_id: string;
  project_title: string;
  state: "awaiting_submission" | "revision_requested" | "pending_review";
  latest_status: Deliverable["status"] | null;
  revision_note?: string;
}

/**
 * Returns active projects assigned to the current provider with their deliverable state.
 * Only includes projects where the contract is fully signed.
 */
export function useProviderDeliverableAlerts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime: refresh when any deliverable for this provider changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-provider-deliverables-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_deliverables",
          filter: `provider_id=eq.${user.id}`,
        },
        () =>
          qc.invalidateQueries({
            queryKey: ["provider-deliverable-alerts", user.id],
          }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return useQuery({
    queryKey: ["provider-deliverable-alerts", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ProviderDeliverableAlert[]> => {
      // Fetch active projects assigned to this provider with a fully-signed contract
      const { data: projects, error: pErr } = await supabase
        .from("projects")
        .select(
          "id, title, status, contracts!inner(association_signed_at, provider_signed_at, deleted_at)",
        )
        .eq("assigned_provider_id", user!.id)
        .in("status", ["in_progress"])
        .is("deleted_at", null);
      if (pErr) throw pErr;

      const eligible = (projects ?? []).filter((p: any) => {
        const c = Array.isArray(p.contracts) ? p.contracts[0] : p.contracts;
        return (
          c && !c.deleted_at && c.association_signed_at && c.provider_signed_at
        );
      });
      if (!eligible.length) return [];

      const ids = eligible.map((p: any) => p.id);
      const { data: dels, error: dErr } = await (supabase as any)
        .from("project_deliverables")
        .select("project_id, status, revision_note, created_at")
        .in("project_id", ids)
        .order("created_at", { ascending: false });
      if (dErr) throw dErr;

      const latestByProject = new Map<string, any>();
      for (const d of dels ?? []) {
        if (!latestByProject.has(d.project_id))
          latestByProject.set(d.project_id, d);
      }

      const alerts: ProviderDeliverableAlert[] = [];
      for (const p of eligible) {
        const latest = latestByProject.get(p.id);
        if (!latest) {
          alerts.push({
            project_id: p.id,
            project_title: p.title,
            state: "awaiting_submission",
            latest_status: null,
          });
        } else if (latest.status === "revision_requested") {
          alerts.push({
            project_id: p.id,
            project_title: p.title,
            state: "revision_requested",
            latest_status: latest.status,
            revision_note: latest.revision_note,
          });
        } else if (latest.status === "pending_review") {
          alerts.push({
            project_id: p.id,
            project_title: p.title,
            state: "pending_review",
            latest_status: latest.status,
          });
        }
        // accepted → no alert
      }
      return alerts;
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
          revision_note:
            action === "revision_requested" ? revisionNote || "" : "",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", deliverableId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["deliverables", variables.projectId],
      });
      toast.success(
        variables.action === "accepted"
          ? "تم قبول التسليمات"
          : "تم طلب التعديلات",
      );
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });
}
