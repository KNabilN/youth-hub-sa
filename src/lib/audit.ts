import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export async function logAudit(
  tableName: string,
  recordId: string,
  action: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("audit_log").insert({
    table_name: tableName,
    record_id: recordId,
    action,
    actor_id: user?.id ?? null,
    old_values: (oldValues as Json) ?? null,
    new_values: (newValues as Json) ?? null,
  });
  if (error) console.error("Failed to log audit:", error);
}
