import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUploadCompanyLogo() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      const userId = user!.id;
      const ext = file.name.split(".").pop();
      const path = `${userId}/company-logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const company_logo_url = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error } = await supabase
        .from("profiles")
        .update({ company_logo_url } as any)
        .eq("id", userId);
      if (error) throw error;
      return company_logo_url;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
