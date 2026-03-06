import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAssociationImpactReports() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["association-impact-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("impact_reports")
        .select("*, profiles:donor_id(full_name, organization_name)")
        .eq("association_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

interface CreateReportInput {
  title: string;
  description: string;
  donorId: string;
  projectId?: string;
  contributionId?: string;
  file: File;
}

export function useCreateImpactReport() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      if (!user) throw new Error("Not authenticated");

      const ext = input.file.name.split(".").pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("impact-reports")
        .upload(filePath, input.file);
      if (uploadErr) throw uploadErr;

      const { data, error } = await supabase
        .from("impact_reports")
        .insert({
          association_id: user.id,
          donor_id: input.donorId,
          title: input.title,
          description: input.description || null,
          project_id: input.projectId || null,
          contribution_id: input.contributionId || null,
          file_name: input.file.name,
          file_path: filePath,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["association-impact-reports"] });
    },
  });
}
