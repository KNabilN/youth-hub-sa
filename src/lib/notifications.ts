import { supabase } from "@/integrations/supabase/client";

export async function sendNotification(
  userId: string,
  message: string,
  type: string = "info",
  entityId?: string,
  entityType?: string
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    message,
    type,
    entity_id: entityId || null,
    entity_type: entityType || null,
  });
  if (error) console.error("Failed to send notification:", error);
}

export async function sendNotifications(
  userIds: string[],
  message: string,
  type: string = "info",
  entityId?: string,
  entityType?: string
) {
  const rows = userIds.map((uid) => ({
    user_id: uid,
    message,
    type,
    entity_id: entityId || null,
    entity_type: entityType || null,
  }));
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.error("Failed to send notifications:", error);
}
