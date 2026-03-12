import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subMonths, parseISO, startOfWeek } from "date-fns";
import { useEffect } from "react";

export function useAdminStats() {
  const qc = useQueryClient();

  // Realtime: invalidate stats on key table changes
  useEffect(() => {
    const tables = ["micro_services", "projects", "disputes", "support_tickets", "escrow_transactions", "profiles"] as const;
    const channels = tables.map((table) =>
      supabase
        .channel(`rt-admin-stats-${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () =>
          qc.invalidateQueries({ queryKey: ["admin-stats"] })
        )
        .subscribe()
    );
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  }, [qc]);

  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString();

      const [usersRes, newUsersRes, projectsRes, pendingProjectsRes, disputesRes, invoicesRes, servicesRes, bidsRes, escrowRes, ticketsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
        supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("invoices").select("commission_amount"),
        supabase.from("micro_services").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("approval", "pending"),
        supabase.from("bids").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("escrow_transactions").select("amount").eq("status", "held"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
      ]);

      const revenue = (invoicesRes.data ?? []).reduce((sum, inv) => sum + Number(inv.commission_amount), 0);
      const heldEscrow = (escrowRes.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        totalUsers: usersRes.count ?? 0,
        newUsersThisWeek: newUsersRes.count ?? 0,
        totalProjects: projectsRes.count ?? 0,
        pendingProjects: pendingProjectsRes.count ?? 0,
        openDisputes: disputesRes.count ?? 0,
        revenue,
        pendingServices: servicesRes.count ?? 0,
        pendingBids: bidsRes.count ?? 0,
        heldEscrow,
        openTickets: ticketsRes.count ?? 0,
      };
    },
  });
}

export function useAdminGrowthData() {
  return useQuery({
    queryKey: ["admin-growth"],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();

      const [usersRes, projectsRes, escrowRes, donationsRes] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", sixMonthsAgo),
        supabase.from("projects").select("created_at, status").gte("created_at", sixMonthsAgo),
        supabase.from("escrow_transactions").select("amount, status, created_at").gte("created_at", sixMonthsAgo),
        supabase.from("donor_contributions").select("amount, created_at").gte("created_at", sixMonthsAgo),
      ]);

      const monthlyData: Record<string, { users: number; projects: number; escrow: number; donations: number }> = {};

      for (let i = 5; i >= 0; i--) {
        const key = format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM");
        monthlyData[key] = { users: 0, projects: 0, escrow: 0, donations: 0 };
      }

      (usersRes.data ?? []).forEach((u) => {
        const key = format(startOfMonth(parseISO(u.created_at)), "yyyy-MM");
        if (monthlyData[key]) monthlyData[key].users++;
      });

      (projectsRes.data ?? []).forEach((p) => {
        const key = format(startOfMonth(parseISO(p.created_at)), "yyyy-MM");
        if (monthlyData[key]) monthlyData[key].projects++;
      });

      (escrowRes.data ?? []).forEach((e) => {
        const key = format(startOfMonth(parseISO(e.created_at)), "yyyy-MM");
        if (monthlyData[key]) monthlyData[key].escrow += Number(e.amount);
      });

      (donationsRes.data ?? []).forEach((d) => {
        const key = format(startOfMonth(parseISO(d.created_at)), "yyyy-MM");
        if (monthlyData[key]) monthlyData[key].donations += Number(d.amount);
      });

      return Object.entries(monthlyData).map(([month, data]) => ({ month, ...data }));
    },
  });
}

export function usePlatformHealth() {
  return useQuery({
    queryKey: ["admin-platform-health"],
    queryFn: async () => {
      const [projectsRes, disputesRes, escrowRes] = await Promise.all([
        supabase.from("projects").select("status"),
        supabase.from("disputes").select("status"),
        supabase.from("escrow_transactions").select("status"),
      ]);

      const projects = projectsRes.data ?? [];
      const completed = projects.filter((p) => p.status === "completed").length;
      const total = projects.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const disputes = disputesRes.data ?? [];
      const resolved = disputes.filter((d) => d.status === "resolved" || d.status === "closed").length;
      const disputeResolutionRate = disputes.length > 0 ? Math.round((resolved / disputes.length) * 100) : 0;

      const escrows = escrowRes.data ?? [];
      const released = escrows.filter((e) => e.status === "released").length;
      const escrowSuccessRate = escrows.length > 0 ? Math.round((released / escrows.length) * 100) : 0;

      return {
        completionRate,
        disputeResolutionRate,
        escrowSuccessRate,
        totalDisputes: disputes.length,
        activeProjects: projects.filter((p) => p.status === "in_progress").length,
      };
    },
  });
}
