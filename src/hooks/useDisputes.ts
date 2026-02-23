import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendNotification } from "@/lib/notifications";

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

      // Notify the other party
      const { data: project } = await supabase
        .from("projects")
        .select("association_id, assigned_provider_id")
        .eq("id", project_id)
        .single();

      if (project) {
        const otherPartyId =
          user!.id === project.association_id
            ? project.assigned_provider_id
            : project.association_id;
        if (otherPartyId) {
          await sendNotification(otherPartyId, "تم رفع نزاع على المشروع", "dispute_raised");
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
  });
}
