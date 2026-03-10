import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUploadCover() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("الحد الأقصى لحجم الصورة 5 ميجابايت");
      const userId = user!.id;
      const ext = file.name.split(".").pop();
      const path = `${userId}/cover.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("cover-images")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("cover-images").getPublicUrl(path);
      const cover_image_url = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error } = await supabase
        .from("profiles")
        .update({ cover_image_url } as any)
        .eq("id", userId);
      if (error) throw error;
      return cover_image_url;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}
