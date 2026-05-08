import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AdminDirectMessage {
 id: string;
 user_id: string;
 sender_id: string;
 content: string;
 attachment_url: string | null;
 attachment_name: string | null;
 is_read: boolean;
 created_at: string;
}

export interface AdminConversation {
 user_id: string;
 last_message: string;
 last_message_at: string;
 unread_count: number;
 user: {
 id: string;
 full_name: string;
 organization_name: string | null;
 avatar_url: string | null;
 user_number: string;
 } | null;
}

/** Admin: list all conversations grouped by user_id */
export function useAdminConversations() {
 const queryClient = useQueryClient();

 const query = useQuery({
 queryKey: ["admin-conversations"],
 queryFn: async (): Promise<AdminConversation[]> => {
 const { data: msgs, error } = await supabase
 .from("admin_direct_messages")
 .select("id, user_id, sender_id, content, is_read, created_at")
 .order("created_at", { ascending: false });
 if (error) throw error;

 const map = new Map<string, AdminConversation>();
 const { data: meRes } = await supabase.auth.getUser();
 const meId = meRes.user?.id;

 for (const m of msgs ?? []) {
 let conv = map.get(m.user_id);
 if (!conv) {
 conv = {
 user_id: m.user_id,
 last_message: m.content,
 last_message_at: m.created_at,
 unread_count: 0,
 user: null,
 };
 map.set(m.user_id, conv);
 }
 // Unread for admin = messages from user not read
 if (m.sender_id !== meId && !m.is_read) {
 conv.unread_count += 1;
 }
 }

 const userIds = Array.from(map.keys());
 if (userIds.length) {
 const { data: profiles } = await supabase
 .from("profiles")
 .select("id, full_name, organization_name, avatar_url, user_number")
 .in("id", userIds);
 for (const p of profiles ?? []) {
 const conv = map.get(p.id);
 if (conv) conv.user = p as AdminConversation["user"];
 }
 }

 return Array.from(map.values()).sort(
 (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
 );
 },
 });

 // Realtime
 useEffect(() => {
 const channel = supabase
 .channel("admin-conversations-realtime")
 .on(
 "postgres_changes",
 { event: "*", schema: "public", table: "admin_direct_messages" },
 () => {
 queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
 }
 )
 .subscribe();
 return () => {
 supabase.removeChannel(channel);
 };
 }, [queryClient]);

 return query;
}

/** Admin total unread (across all user conversations) */
export function useAdminUnreadTotal() {
 const { user } = useAuth();
 return useQuery({
 queryKey: ["admin-messages-unread-total", user?.id],
 queryFn: async () => {
 const { count, error } = await supabase
 .from("admin_direct_messages")
 .select("id", { count: "exact", head: true })
 .neq("sender_id", user!.id)
 .eq("is_read", false);
 if (error) throw error;
 return count ?? 0;
 },
 enabled: !!user,
 refetchInterval: 30000,
 });
}

/** Both admin and user: read a single thread (one user_id) + realtime */
export function useAdminMessageThread(userId: string | undefined) {
 const queryClient = useQueryClient();

 const query = useQuery({
 queryKey: ["admin-message-thread", userId],
 queryFn: async (): Promise<AdminDirectMessage[]> => {
 if (!userId) return [];
 const { data, error } = await supabase
 .from("admin_direct_messages")
 .select("*")
 .eq("user_id", userId)
 .order("created_at", { ascending: true });
 if (error) throw error;
 return (data ?? []) as AdminDirectMessage[];
 },
 enabled: !!userId,
 });

 useEffect(() => {
 if (!userId) return;
 const channel = supabase
 .channel(`admin-thread-${userId}`)
 .on(
 "postgres_changes",
 { event: "*", schema: "public", table: "admin_direct_messages", filter: `user_id=eq.${userId}` },
 () => {
 queryClient.invalidateQueries({ queryKey: ["admin-message-thread", userId] });
 queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
 queryClient.invalidateQueries({ queryKey: ["user-admin-conversation"] });
 queryClient.invalidateQueries({ queryKey: ["admin-messages-unread-total"] });
 }
 )
 .subscribe();
 return () => {
 supabase.removeChannel(channel);
 };
 }, [userId, queryClient]);

 return query;
}

/** Send a message in a thread */
export function useSendAdminMessage() {
 const queryClient = useQueryClient();
 const { user } = useAuth();
 return useMutation({
 mutationFn: async (vars: {
 userId: string;
 content: string;
 attachmentUrl?: string;
 attachmentName?: string;
 }) => {
 if (!user) throw new Error("Not authenticated");
 const { error } = await supabase.from("admin_direct_messages").insert({
 user_id: vars.userId,
 sender_id: user.id,
 content: vars.content,
 attachment_url: vars.attachmentUrl ?? null,
 attachment_name: vars.attachmentName ?? null,
 });
 if (error) throw error;
 },
 onSuccess: (_, vars) => {
 queryClient.invalidateQueries({ queryKey: ["admin-message-thread", vars.userId] });
 queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
 queryClient.invalidateQueries({ queryKey: ["user-admin-conversation"] });
 },
 });
}

/** Mark messages as read (the recipient marks the sender's unread messages) */
export function useMarkAdminMessagesRead() {
 const queryClient = useQueryClient();
 const { user } = useAuth();
 return useMutation({
 mutationFn: async (userId: string) => {
 if (!user) return;
 const { error } = await supabase
 .from("admin_direct_messages")
 .update({ is_read: true })
 .eq("user_id", userId)
 .neq("sender_id", user.id)
 .eq("is_read", false);
 if (error) throw error;
 },
 onSuccess: (_, userId) => {
 queryClient.invalidateQueries({ queryKey: ["admin-message-thread", userId] });
 queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
 queryClient.invalidateQueries({ queryKey: ["user-admin-conversation"] });
 queryClient.invalidateQueries({ queryKey: ["admin-messages-unread-total"] });
 queryClient.invalidateQueries({ queryKey: ["user-admin-unread"] });
 },
 });
}

/** Non-admin user: their single conversation with admin team + unread count */
export function useUserAdminConversation() {
 const { user } = useAuth();
 const queryClient = useQueryClient();

 const query = useQuery({
 queryKey: ["user-admin-conversation", user?.id],
 queryFn: async () => {
 if (!user) return null;
 const { data, error } = await supabase
 .from("admin_direct_messages")
 .select("*")
 .eq("user_id", user.id)
 .order("created_at", { ascending: false })
 .limit(1);
 if (error) throw error;
 const last = data?.[0];

 const { count } = await supabase
 .from("admin_direct_messages")
 .select("id", { count: "exact", head: true })
 .eq("user_id", user.id)
 .neq("sender_id", user.id)
 .eq("is_read", false);

 return {
 hasConversation: !!last,
 last_message: last?.content ?? "",
 last_message_at: last?.created_at ?? null,
 unread_count: count ?? 0,
 };
 },
 enabled: !!user,
 });

 useEffect(() => {
 if (!user) return;
 const channel = supabase
 .channel(`user-admin-conv-${user.id}`)
 .on(
 "postgres_changes",
 { event: "*", schema: "public", table: "admin_direct_messages", filter: `user_id=eq.${user.id}` },
 () => {
 queryClient.invalidateQueries({ queryKey: ["user-admin-conversation", user.id] });
 queryClient.invalidateQueries({ queryKey: ["user-admin-unread", user.id] });
 }
 )
 .subscribe();
 return () => {
 supabase.removeChannel(channel);
 };
 }, [user, queryClient]);

 return query;
}

/** User-side unread count badge (used in sidebar) */
export function useUserAdminUnread() {
 const { user } = useAuth();
 return useQuery({
 queryKey: ["user-admin-unread", user?.id],
 queryFn: async () => {
 if (!user) return 0;
 const { count, error } = await supabase
 .from("admin_direct_messages")
 .select("id", { count: "exact", head: true })
 .eq("user_id", user.id)
 .neq("sender_id", user.id)
 .eq("is_read", false);
 if (error) throw error;
 return count ?? 0;
 },
 enabled: !!user,
 refetchInterval: 30000,
 });
}
