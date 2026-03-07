import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  is_read: boolean;
  created_at: string;
  sender?: { full_name: string; avatar_url: string | null; organization_name?: string | null };
}

export function useMessages(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", projectId],
    enabled: !!user && !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url, organization_name)")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Message[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user || !projectId) return;
    const channel = supabase
      .channel(`messages-${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, projectId, queryClient]);

  return query;
}

export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      content,
      attachmentUrl,
      attachmentName,
    }: {
      projectId: string;
      content: string;
      attachmentUrl?: string;
      attachmentName?: string;
    }) => {
      const { error } = await supabase.from("messages").insert({
        project_id: projectId,
        sender_id: user!.id,
        content,
        attachment_url: attachmentUrl ?? null,
        attachment_name: attachmentName ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["messages", vars.projectId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkMessagesRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("project_id", projectId)
        .neq("sender_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export interface Conversation {
  project_id: string;
  project_title: string;
  other_party_name: string;
  other_party_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get projects where user is involved and has assigned provider
      const { data: projects, error: pErr } = await supabase
        .from("projects")
        .select("id, title, association_id, assigned_provider_id")
        .or(`association_id.eq.${user!.id},assigned_provider_id.eq.${user!.id}`)
        .not("assigned_provider_id", "is", null);
      if (pErr) throw pErr;
      if (!projects?.length) return [];

      const projectIds = projects.map((p) => p.id);

      // Get recent messages per project (limited to avoid hitting row limits)
      type MsgRow = { project_id: string; content: string; created_at: string; sender_id: string; is_read: boolean };
      const allMessages: MsgRow[] = [];
      for (const pid of projectIds) {
        const { data: projectMsgs, error: mErr } = await supabase
          .from("messages")
          .select("project_id, content, created_at, sender_id, is_read")
          .eq("project_id", pid)
          .order("created_at", { ascending: false })
          .limit(50);
        if (mErr) throw mErr;
        if (projectMsgs) allMessages.push(...projectMsgs);
      }
      const messages = allMessages;

      // Get other party profiles
      const otherPartyIds = projects.map((p) =>
        p.association_id === user!.id ? p.assigned_provider_id : p.association_id
      ).filter(Boolean) as string[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, organization_name")
        .in("id", [...new Set(otherPartyIds)]);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      const conversations: Conversation[] = [];
      for (const project of projects) {
        const projectMessages = (messages ?? []).filter((m) => m.project_id === project.id);
        const lastMsg = projectMessages[0];
        const unreadCount = projectMessages.filter(
          (m) => m.sender_id !== user!.id && !m.is_read
        ).length;

        const otherPartyId =
          project.association_id === user!.id ? project.assigned_provider_id : project.association_id;
        const otherProfile = profileMap.get(otherPartyId!);

        conversations.push({
          project_id: project.id,
          project_title: project.title,
          other_party_name: otherProfile?.organization_name || otherProfile?.full_name || "مستخدم",
          other_party_avatar: otherProfile?.avatar_url ?? null,
          last_message: lastMsg?.content ?? "",
          last_message_at: lastMsg?.created_at ?? project.id,
          unread_count: unreadCount,
        });
      }

      return conversations.sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    },
  });
}
