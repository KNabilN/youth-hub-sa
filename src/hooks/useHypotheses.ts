import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Hypothesis {
  id: number;
  hypothesis_number: number;
  domain: string;
  hypothesis: string;
  metric: string;
  test_method: string;
  success_criteria: string;
  status: string;
  actual_value: string;
  admin_notes: string;
  updated_at: string;
  updated_by: string | null;
}

export function useHypotheses() {
  return useQuery({
    queryKey: ["hypotheses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hypotheses" as any)
        .select("*")
        .order("hypothesis_number");
      if (error) throw error;
      return (data as any[]) as Hypothesis[];
    },
  });
}

export function useUpdateHypothesis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      actual_value,
      admin_notes,
    }: {
      id: number;
      status?: string;
      actual_value?: string;
      admin_notes?: string;
    }) => {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (status !== undefined) updates.status = status;
      if (actual_value !== undefined) updates.actual_value = actual_value;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;

      const { error } = await supabase
        .from("hypotheses" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hypotheses"] }),
  });
}

