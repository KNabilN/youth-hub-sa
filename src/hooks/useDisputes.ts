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
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
  });
}
