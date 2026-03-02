import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCities(regionId?: string | null) {
  return useQuery({
    queryKey: ["cities", regionId ?? "all"],
    queryFn: async () => {
      let query = supabase.from("cities").select("*").order("name");
      if (regionId && regionId !== "all") {
        query = query.eq("region_id", regionId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
