import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function usePortfolio(providerId?: string) {
  return useQuery({
    queryKey: ["portfolio", providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("provider_id", providerId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddPortfolioItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ title, description, file }: { title: string; description: string; file: File }) => {
      const userId = user!.id;
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("portfolio").getPublicUrl(path);
      const { error } = await supabase.from("portfolio_items").insert({
        provider_id: userId,
        title,
        description,
        image_url: urlData.publicUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, image_url }: { id: string; image_url: string }) => {
      // Soft delete - don't remove from storage yet
      const { error } = await supabase
        .from("portfolio_items")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}
