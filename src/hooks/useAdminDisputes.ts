import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DisputeStatus = Database["public"]["Enums"]["dispute_status"];

export function useAdminDisputes() {
  return useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*, projects(title), profiles!disputes_raised_by_fkey(full_name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resolution_notes }: { id: string; status: DisputeStatus; resolution_notes?: string }) => {
      const update: Record<string, any> = { status };
      if (resolution_notes !== undefined) update.resolution_notes = resolution_notes;
      const { error } = await supabase.from("disputes").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-disputes"] }),
  });
}
