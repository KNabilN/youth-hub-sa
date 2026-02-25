import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEntityAuditLog(tableName: string, recordId: string | null) {
  return useQuery({
    queryKey: ["entity-audit-log", tableName, recordId],
    enabled: !!recordId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*, profiles:actor_id(full_name)")
        .eq("table_name", tableName)
        .eq("record_id", recordId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}
