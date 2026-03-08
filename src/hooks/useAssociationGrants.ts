import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function useReceivedGrants() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["association-received-grants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("*, profiles:donor_id(full_name, organization_name, avatar_url), projects(title), micro_services:service_id(title)")
        .eq("association_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAssociationGrantBalance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["association-grant-balance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("amount, donation_status")
        .eq("association_id", user!.id);
      if (error) throw error;

      const rows = data ?? [];
      const total = rows.reduce((s, r) => s + Number(r.amount), 0);
      const available = rows.filter(r => r.donation_status === "available").reduce((s, r) => s + Number(r.amount), 0);
      const consumed = rows.filter(r => r.donation_status === "consumed").reduce((s, r) => s + Number(r.amount), 0);
      const reserved = total - available - consumed;

      return { total, available, consumed, reserved, donorCount: new Set(rows.map(() => "")).size };
    },
  });
}

export function useAssociationGrantStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["association-grant-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_contributions")
        .select("amount, donation_status, donor_id")
        .eq("association_id", user!.id);
      if (error) throw error;

      const rows = data ?? [];
      const totalGrants = rows.reduce((s, r) => s + Number(r.amount), 0);
      const available = rows.filter(r => r.donation_status === "available").reduce((s, r) => s + Number(r.amount), 0);
      const donorIds = new Set(rows.map(r => r.donor_id));

      return { totalGrants, availableBalance: available, donorCount: donorIds.size };
    },
  });
}

/** Returns available grant balance breakdown for a specific project or service */
export function useProjectGrantBalance(projectId?: string, serviceId?: string) {
  const { user } = useAuth();
  const entityId = projectId || serviceId;
  const entityType = projectId ? "project" : "service";

  return useQuery({
    queryKey: ["project-grant-balance", user?.id, entityType, entityId],
    enabled: !!user && !!entityId,
    queryFn: async () => {
      // 1. Fetch grants specific to this project/service
      const specificFilter = projectId
        ? supabase.from("donor_contributions").select("amount").eq("association_id", user!.id).eq("donation_status", "available").eq("project_id", projectId)
        : supabase.from("donor_contributions").select("amount").eq("association_id", user!.id).eq("donation_status", "available").eq("service_id", serviceId!);

      const { data: specificData, error: e1 } = await specificFilter;
      if (e1) throw e1;

      // 2. Fetch general grants (no project_id and no service_id)
      const { data: generalData, error: e2 } = await supabase
        .from("donor_contributions")
        .select("amount")
        .eq("association_id", user!.id)
        .eq("donation_status", "available")
        .is("project_id", null)
        .is("service_id", null);
      if (e2) throw e2;

      const projectSpecific = (specificData ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const general = (generalData ?? []).reduce((s, r) => s + Number(r.amount), 0);

      return { projectSpecific, general, total: projectSpecific + general };
    },
  });
}
