import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminUploadAvatar(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 2 * 1024 * 1024) throw new Error("الحد الأقصى لحجم الصورة 2 ميجابايت");
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error } = await supabase.from("profiles").update({ avatar_url }).eq("id", userId);
      if (error) throw error;
      return avatar_url;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-by-id", userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}

export function useAdminUploadCover(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("الحد الأقصى لحجم الصورة 5 ميجابايت");
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
      qc.invalidateQueries({ queryKey: ["admin-user-by-id", userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}
