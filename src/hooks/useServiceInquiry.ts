import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface InquiryMessage {
  id: string;
  inquiry_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  is_read: boolean;
  created_at: string;
  sender?: { full_name: string; avatar_url: string | null; organization_name?: string | null };
}

export interface ServiceInquiry {
  id: string;
  service_id: string;
  sender_id: string;
  provider_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Fetch or create inquiry for a service */
export function useServiceInquiry(serviceId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["service-inquiry", serviceId, user?.id],
    enabled: !!user && !!serviceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_inquiries")
        .select("*")
        .eq("service_id", serviceId!)
        .eq("sender_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as ServiceInquiry | null;
    },
  });
}

/** Create a new inquiry thread */
export function useCreateInquiry() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, providerId }: { serviceId: string; providerId: string }) => {
      const { data, error } = await supabase
        .from("service_inquiries")
        .insert({
          service_id: serviceId,
          sender_id: user!.id,
          provider_id: providerId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ServiceInquiry;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["service-inquiry", data.service_id] });
      qc.invalidateQueries({ queryKey: ["service-inquiry-conversations"] });
    },
  });
}

/** Fetch messages for an inquiry with realtime */
export function useInquiryMessages(inquiryId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user || !inquiryId) return;
    const channel = supabase
      .channel(`inquiry-msgs-${inquiryId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_inquiry_messages", filter: `inquiry_id=eq.${inquiryId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["inquiry-messages", inquiryId] });
          qc.invalidateQueries({ queryKey: ["service-inquiry-conversations"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, inquiryId, qc]);

  return useQuery({
    queryKey: ["inquiry-messages", inquiryId],
    enabled: !!user && !!inquiryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_inquiry_messages")
        .select("*, sender:profiles!service_inquiry_messages_sender_id_fkey(full_name, avatar_url, organization_name)")
        .eq("inquiry_id", inquiryId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as InquiryMessage[];
    },
  });
}

/** Send a message in an inquiry */
export function useSendInquiryMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inquiryId, content, attachmentUrl, attachmentName,
    }: {
      inquiryId: string; content: string; attachmentUrl?: string; attachmentName?: string;
    }) => {
      const { error } = await supabase.from("service_inquiry_messages").insert({
        inquiry_id: inquiryId,
        sender_id: user!.id,
        content,
        attachment_url: attachmentUrl ?? null,
        attachment_name: attachmentName ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["inquiry-messages", vars.inquiryId] });
      qc.invalidateQueries({ queryKey: ["service-inquiry-conversations"] });
    },
  });
}

/** Mark inquiry messages as read */
export function useMarkInquiryRead() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (inquiryId: string) => {
      const { error } = await supabase
        .from("service_inquiry_messages")
        .update({ is_read: true })
        .eq("inquiry_id", inquiryId)
        .neq("sender_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: (_, inquiryId) => {
      qc.invalidateQueries({ queryKey: ["inquiry-messages", inquiryId] });
      qc.invalidateQueries({ queryKey: ["service-inquiry-conversations"] });
    },
  });
}

/** Fetch all inquiry conversations for the current user */
export interface InquiryConversation {
  inquiry_id: string;
  service_id: string;
  service_title: string;
  other_party_name: string;
  other_party_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useInquiryConversations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`rt-inquiry-convs-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_inquiry_messages" },
        () => qc.invalidateQueries({ queryKey: ["service-inquiry-conversations"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["service-inquiry-conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get all inquiries involving the user
      const { data: inquiries, error: iErr } = await supabase
        .from("service_inquiries")
        .select("id, service_id, sender_id, provider_id, updated_at")
        .or(`sender_id.eq.${user!.id},provider_id.eq.${user!.id}`);
      if (iErr) throw iErr;
      if (!inquiries?.length) return [];

      const inquiryIds = inquiries.map(i => i.id);
      const serviceIds = [...new Set(inquiries.map(i => i.service_id))];
      const otherPartyIds = [...new Set(inquiries.map(i =>
        i.sender_id === user!.id ? i.provider_id : i.sender_id
      ))];

      // Batch fetch services, profiles, messages
      const [servicesRes, profilesRes, messagesRes] = await Promise.all([
        supabase.from("micro_services").select("id, title").in("id", serviceIds),
        supabase.from("profiles").select("id, full_name, avatar_url, organization_name").in("id", otherPartyIds),
        supabase.from("service_inquiry_messages")
          .select("inquiry_id, content, created_at, sender_id, is_read")
          .in("inquiry_id", inquiryIds)
          .order("created_at", { ascending: false }),
      ]);

      const serviceMap = new Map((servicesRes.data ?? []).map(s => [s.id, s]));
      const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]));

      const conversations: InquiryConversation[] = [];
      for (const inq of inquiries) {
        const msgs = (messagesRes.data ?? []).filter(m => m.inquiry_id === inq.id);
        const lastMsg = msgs[0];
        const unreadCount = msgs.filter(m => m.sender_id !== user!.id && !m.is_read).length;

        const otherPartyId = inq.sender_id === user!.id ? inq.provider_id : inq.sender_id;
        const otherProfile = profileMap.get(otherPartyId);
        const service = serviceMap.get(inq.service_id);

        conversations.push({
          inquiry_id: inq.id,
          service_id: inq.service_id,
          service_title: service?.title ?? "خدمة",
          other_party_name: otherProfile?.organization_name || otherProfile?.full_name || "مستخدم",
          other_party_avatar: otherProfile?.avatar_url ?? null,
          last_message: lastMsg?.content ?? "",
          last_message_at: lastMsg?.created_at ?? inq.updated_at,
          unread_count: unreadCount,
        });
      }

      return conversations.sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    },
  });
}
