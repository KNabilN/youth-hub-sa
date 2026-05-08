import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCategorySkills(categoryId: string | null | undefined) {
  return useQuery({
    queryKey: ["category-skills", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from("category_skills")
        .select("id, name")
        .eq("category_id", categoryId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!categoryId,
  });
}
