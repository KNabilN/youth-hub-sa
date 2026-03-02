import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TrashTableName = "micro_services" | "projects" | "support_tickets" | "portfolio_items" | "disputes";

const tableConfig: Record<TrashTableName, { label: string; ownerCol: string; titleCol: string }> = {
  micro_services: { label: "خدمات", ownerCol: "provider_id", titleCol: "title" },
  projects: { label: "طلبات", ownerCol: "association_id", titleCol: "title" },
  support_tickets: { label: "تذاكر", ownerCol: "user_id", titleCol: "subject" },
  portfolio_items: { label: "أعمال المعرض", ownerCol: "provider_id", titleCol: "title" },
  disputes: { label: "شكاوى", ownerCol: "raised_by", titleCol: "description" },
};

export interface TrashItem {
  id: string;
  title: string;
  table: TrashTableName;
  tableLabel: string;
  deleted_at: string;
  daysRemaining: number;
}

export function useTrashItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["trash-items", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const userId = user!.id;
      const results: TrashItem[] = [];
      const now = new Date();

      for (const [table, cfg] of Object.entries(tableConfig) as [TrashTableName, typeof tableConfig[TrashTableName]][]) {
        const { data } = await (supabase
          .from(table)
          .select("*") as any)
          .eq(cfg.ownerCol, userId)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false });

        if (data) {
          for (const row of data as any[]) {
            const deletedAt = new Date(row.deleted_at);
            const daysElapsed = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);
            results.push({
              id: row.id,
              title: row[cfg.titleCol] || "بدون عنوان",
              table,
              tableLabel: cfg.label,
              deleted_at: row.deleted_at,
              daysRemaining: Math.max(0, Math.ceil(30 - daysElapsed)),
            });
          }
        }
      }

      return results;
    },
  });
}

export function useTrashCount() {
  const { data } = useTrashItems();
  return data?.length ?? 0;
}

export function useRestoreItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id }: { table: TrashTableName; id: string }) => {
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash-items"] });
      qc.invalidateQueries({ queryKey: ["my-services"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });
}

export function usePermanentDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id }: { table: TrashTableName; id: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash-items"] });
    },
  });
}

export function useSoftDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id }: { table: TrashTableName; id: string }) => {
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["trash-items"] });
      if (vars.table === "micro_services") {
        qc.invalidateQueries({ queryKey: ["my-services"] });
        qc.invalidateQueries({ queryKey: ["admin-services"] });
      }
      if (vars.table === "projects") qc.invalidateQueries({ queryKey: ["projects"] });
      if (vars.table === "support_tickets") qc.invalidateQueries({ queryKey: ["support-tickets"] });
      if (vars.table === "portfolio_items") qc.invalidateQueries({ queryKey: ["portfolio"] });
      if (vars.table === "disputes") qc.invalidateQueries({ queryKey: ["my-disputes"] });
    },
  });
}

export function useEmptyTrash() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const userId = user!.id;
      for (const [table, cfg] of Object.entries(tableConfig) as [TrashTableName, typeof tableConfig[TrashTableName]][]) {
        await (supabase
          .from(table)
          .delete() as any)
          .eq(cfg.ownerCol, userId)
          .not("deleted_at", "is", null);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash-items"] });
      qc.invalidateQueries({ queryKey: ["my-services"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
    },
  });
}
