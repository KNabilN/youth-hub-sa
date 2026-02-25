import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminNotifications(filter?: string, page = 0, pageSize = 50) {
  return useQuery({
    queryKey: ["admin-notifications", filter, page],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filter && filter !== "all") {
        query = query.eq("delivery_status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminNotificationStats() {
  return useQuery({
    queryKey: ["admin-notification-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("delivery_status");
      if (error) throw error;
      const total = data.length;
      const delivered = data.filter(n => n.delivery_status === "delivered").length;
      const failed = data.filter(n => n.delivery_status === "failed").length;
      const pending = data.filter(n => n.delivery_status === "pending").length;
      return { total, delivered, failed, pending };
    },
  });
}

export function useResendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notification: { user_id: string; message: string; type: string }) => {
      const { error } = await supabase.from("notifications").insert({
        user_id: notification.user_id,
        message: notification.message,
        type: notification.type,
        delivery_status: "delivered",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      qc.invalidateQueries({ queryKey: ["admin-notification-stats"] });
    },
  });
}
