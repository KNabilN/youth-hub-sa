import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ImpactReport {
  id: string;
  contribution_id: string | null;
  project_id: string | null;
  association_id: string;
  donor_id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  created_at: string;
  association?: { full_name: string; organization_name: string | null; avatar_url: string | null; company_logo_url: string | null };
  project?: { title: string } | null;
}

export function useImpactReports() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["impact-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("impact_reports" as any)
        .select("*")
        .eq("donor_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const reports = (data ?? []) as any[];

      // Fetch association profiles and project titles
      const assocIds = [...new Set(reports.map((r) => r.association_id))];
      const projectIds = [...new Set(reports.filter((r) => r.project_id).map((r) => r.project_id))];

      const [assocRes, projRes] = await Promise.all([
        assocIds.length
          ? supabase.from("profiles").select("id, full_name, organization_name, avatar_url, company_logo_url").in("id", assocIds)
          : { data: [] },
        projectIds.length
          ? supabase.from("projects").select("id, title").in("id", projectIds)
          : { data: [] },
      ]);

      const assocMap = new Map((assocRes.data ?? []).map((a: any) => [a.id, a]));
      const projMap = new Map((projRes.data ?? []).map((p: any) => [p.id, p]));

      return reports.map((r) => ({
        ...r,
        association: assocMap.get(r.association_id),
        project: r.project_id ? projMap.get(r.project_id) ?? null : null,
      })) as ImpactReport[];
    },
  });
}

export function useImpactReportsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["impact-reports-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("impact_reports" as any)
        .select("*", { count: "exact", head: true })
        .eq("donor_id", user!.id);

      if (error) throw error;
      return count ?? 0;
    },
  });
}
