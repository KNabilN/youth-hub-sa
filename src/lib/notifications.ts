import { supabase } from "@/integrations/supabase/client";

export async function sendNotification(
  userId: string,
  message: string,
  type: string = "info"
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    message,
    type,
  });
  if (error) console.error("Failed to send notification:", error);
}

export async function sendNotifications(
  userIds: string[],
  message: string,
  type: string = "info"
) {
  const rows = userIds.map((uid) => ({ user_id: uid, message, type }));
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.error("Failed to send notifications:", error);
}
