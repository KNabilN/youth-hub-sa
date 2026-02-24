import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSiteContent(sectionKey: string) {
  return useQuery({
    queryKey: ["site-content", sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (error) throw error;
      return data?.content as Record<string, any> | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllSiteContent() {
  return useQuery({
    queryKey: ["site-content-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .order("section_key");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateSiteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionKey, content }: { sectionKey: string; content: Record<string, any> }) => {
      const { error } = await supabase
        .from("site_content")
        .update({ content, updated_at: new Date().toISOString() } as any)
        .eq("section_key", sectionKey);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["site-content", vars.sectionKey] });
      qc.invalidateQueries({ queryKey: ["site-content-all"] });
    },
  });
}
