import { supabase } from "@/integrations/supabase/client";

export async function sendNotification(
 userId: string,
 message: string,
 type: string = "info",
 entityId?: string,
 entityType?: string
) {
 const { error } = await supabase.rpc("send_notification_secure" as any, {
 _recipient_id: userId,
 _message: message,
 _type: type,
 _entity_id: entityId || null,
 _entity_type: entityType || null,
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
 const promises = userIds.map((uid) =>
 supabase.rpc("send_notification_secure" as any, {
 _recipient_id: uid,
 _message: message,
 _type: type,
 _entity_id: entityId || null,
 _entity_type: entityType || null,
 })
 );
 const results = await Promise.all(promises);
 const errors = results.filter((r) => r.error);
 if (errors.length) console.error("Failed to send some notifications:", errors);
}
