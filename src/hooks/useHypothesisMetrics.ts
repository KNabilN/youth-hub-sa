import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HypothesisMetrics {
  h1: {
    activeProviderPct: number | null;
    retentionPct90: number | null;
    totalProviders: number;
    activeCount: number;
    retainedCount: number;
  };
  h2: {
    avgHoursToFirstBid: number | null;
    pctWithin48h: number | null;
    closureWithFast: number | null;
    closureWithSlow: number | null;
    totalProjectsWithBids: number;
  };
  h3: {
    monthlyTrend: Array<{
      month: string;
      activeProviders: number;
      avgFirstBidHours: number | null;
      closureRate: number | null;
    }>;
  };
  h5: {
    providersWithPackages: number;
    totalProviders: number;
    pct: number | null;
  };
  h7: {
    ratingPct: number | null;
    complaintsPct: number | null;
    totalRatings: number;
    totalProjects: number;
    totalDisputes: number;
  };
  h8: {
    noDisputePct: number | null;
    avgResolutionDays: number | null;
    pctResolvedIn7: number | null;
    totalDone: number;
    totalDisputes: number;
  };
  h9: {
    avgTimingScore: number | null;
    repeatPurchasePct: number | null;
    totalRatings: number;
    repeatAssociations: number;
    totalAssociationsWithCompleted: number;
  };
  h10: {
    avgHoursToFirstBid: number | null;
    closureCorrelation: string;
  };
  h11: {
    avgRequestsPer90Days: number | null;
    activeAssociations: number;
    totalAssociations: number;
    repeatAssociations: number;
  };
  h12: {
    conversionPct: number | null;
    avgDaysToFirstProject: number | null;
    totalAssociations: number;
    convertedAssociations: number;
  };
  h14: {
    fixedCount: number;
    packageCount: number;
    fixedAvgValue: number | null;
    packageAvgValue: number | null;
  };
  h15: {
    rejectionPct: number | null;
    avgDecisionHours: number | null;
    totalBids: number;
    rejectedBids: number;
  };
  h17: {
    repeatPurchasePct120: number | null;
    avgTicketsPerProject: number | null;
    totalTickets: number;
    totalProjects: number;
  };
  h18: {
    selfPayPct: number | null;
    totalEscrow: number;
    selfPayCount: number;
    monthlyTrend: Array<{ month: string; selfPct: number }>;
  };
  h23: {
    avgResolutionDays: number | null;
    pctIn7Days: number | null;
    totalResolved: number;
  };
  h24: {
    closureWithEscrow: number | null;
    closureWithout: number | null;
    disputesWithEscrowPct: number | null;
    disputesWithoutPct: number | null;
    projectsWithEscrow: number;
    projectsWithout: number;
  };
  h25: {
    avgCompleteness: number | null;
    totalProfiles: number;
    fullyComplete: number;
  };
}

function diffHours(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
}

function diffDays(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

function monthKey(d: string): string {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

export function useHypothesisMetrics() {
  return useQuery({
    queryKey: ["hypothesis-metrics-v2"],
    queryFn: async (): Promise<HypothesisMetrics> => {
      // Fetch all needed data in parallel
      const [
        { data: projects },
        { data: bids },
        { data: ratings },
        { data: disputes },
        { data: disputeLogs },
        { data: escrows },
        { data: roles },
        { data: services },
        { data: profiles },
        { count: ticketCount },
      ] = await Promise.all([
        supabase.from("projects").select("id, created_at, status, association_id, assigned_provider_id"),
        supabase.from("bids").select("id, created_at, project_id, provider_id, status"),
        supabase.from("ratings").select("quality_score, communication_score, timing_score, contract_id, created_at"),
        supabase.from("disputes").select("id, project_id, created_at, status"),
        supabase.from("dispute_status_log" as any).select("dispute_id, old_status, new_status, created_at"),
        supabase.from("escrow_transactions").select("id, project_id, service_id, grant_request_id, status, amount, created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("micro_services").select("id, provider_id, packages, service_type, price"),
        supabase.from("profiles").select("id, full_name, bio, phone, skills, region_id, city_id, avatar_url, organization_name, license_number, bank_iban, created_at"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }),
      ]);

      const allProjects = projects ?? [];
      const allBids = bids ?? [];
      const allRatings = ratings ?? [];
      const allDisputes = disputes ?? [];
      const allDisputeLogs = (disputeLogs as any[]) ?? [];
      const allEscrows = escrows ?? [];
      const allRoles = roles ?? [];
      const allServices = services ?? [];
      const allProfiles = profiles ?? [];

      const providerIds = new Set(allRoles.filter((r) => r.role === "service_provider").map((r) => r.user_id));
      const associationIds = new Set(allRoles.filter((r) => r.role === "youth_association").map((r) => r.user_id));

      const now = Date.now();
      const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();
      const ninetyDaysAgo = new Date(now - 90 * 86400000).toISOString();

      // ========== H1: Active Providers ==========
      const activeBidders30 = new Set(
        allBids.filter((b) => b.created_at >= thirtyDaysAgo).map((b) => b.provider_id)
      );
      const activeCount = [...activeBidders30].filter((id) => providerIds.has(id)).size;
      const activeBidders90 = new Set(
        allBids.filter((b) => b.created_at >= ninetyDaysAgo).map((b) => b.provider_id)
      );
      const retainedCount = [...activeBidders90].filter((id) => providerIds.has(id)).size;
      const totalProviders = providerIds.size;

      const h1 = {
        activeProviderPct: totalProviders > 0 ? Math.round((activeCount / totalProviders) * 100) : null,
        retentionPct90: totalProviders > 0 ? Math.round((retainedCount / totalProviders) * 100) : null,
        totalProviders,
        activeCount,
        retainedCount,
      };

      // ========== H2: Time to First Bid ==========
      const projectBidTimes: Map<string, { firstBidHours: number; projectStatus: string }> = new Map();
      const bidsByProject = new Map<string, typeof allBids>();
      allBids.forEach((b) => {
        if (!bidsByProject.has(b.project_id)) bidsByProject.set(b.project_id, []);
        bidsByProject.get(b.project_id)!.push(b);
      });

      allProjects.forEach((p) => {
        const pBids = bidsByProject.get(p.id);
        if (!pBids || pBids.length === 0) return;
        const firstBid = pBids.reduce((min, b) => (b.created_at < min.created_at ? b : min), pBids[0]);
        const hours = diffHours(p.created_at, firstBid.created_at);
        projectBidTimes.set(p.id, { firstBidHours: hours, projectStatus: p.status });
      });

      const bidTimeEntries = [...projectBidTimes.values()];
      const avgHoursToFirstBid = bidTimeEntries.length > 0
        ? Math.round(bidTimeEntries.reduce((s, e) => s + e.firstBidHours, 0) / bidTimeEntries.length)
        : null;
      const within48h = bidTimeEntries.filter((e) => e.firstBidHours <= 48).length;
      const pctWithin48h = bidTimeEntries.length > 0 ? Math.round((within48h / bidTimeEntries.length) * 100) : null;

      const fastBids = bidTimeEntries.filter((e) => e.firstBidHours <= 48);
      const slowBids = bidTimeEntries.filter((e) => e.firstBidHours > 48);
      const closureWithFast = fastBids.length > 0
        ? Math.round((fastBids.filter((e) => e.projectStatus === "completed" || e.projectStatus === "in_progress").length / fastBids.length) * 100)
        : null;
      const closureWithSlow = slowBids.length > 0
        ? Math.round((slowBids.filter((e) => e.projectStatus === "completed" || e.projectStatus === "in_progress").length / slowBids.length) * 100)
        : null;

      const h2 = {
        avgHoursToFirstBid,
        pctWithin48h,
        closureWithFast,
        closureWithSlow,
        totalProjectsWithBids: bidTimeEntries.length,
      };

      // ========== H3: Monthly Trend ==========
      const monthsMap = new Map<string, { providers: Set<string>; bidTimes: number[]; completed: number; total: number }>();
      allProjects.forEach((p) => {
        const m = monthKey(p.created_at);
        if (!monthsMap.has(m)) monthsMap.set(m, { providers: new Set(), bidTimes: [], completed: 0, total: 0 });
        const entry = monthsMap.get(m)!;
        entry.total++;
        if (p.status === "completed") entry.completed++;
        const pBids = bidsByProject.get(p.id);
        if (pBids) {
          pBids.forEach((b) => entry.providers.add(b.provider_id));
          const firstBid = pBids.reduce((min, b) => (b.created_at < min.created_at ? b : min), pBids[0]);
          entry.bidTimes.push(diffHours(p.created_at, firstBid.created_at));
        }
      });

      const monthlyTrend = [...monthsMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, data]) => ({
          month,
          activeProviders: data.providers.size,
          avgFirstBidHours: data.bidTimes.length > 0
            ? Math.round(data.bidTimes.reduce((s, v) => s + v, 0) / data.bidTimes.length)
            : null,
          closureRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : null,
        }));

      const h3 = { monthlyTrend };

      // ========== H5: Packages ==========
      const providersWithPackages = new Set(
        allServices.filter((s) => {
          const pkgs = s.packages as any;
          return pkgs && Array.isArray(pkgs) && pkgs.length > 0;
        }).map((s) => s.provider_id)
      ).size;

      const h5 = {
        providersWithPackages,
        totalProviders,
        pct: totalProviders > 0 ? Math.round((providersWithPackages / totalProviders) * 100) : null,
      };

      // ========== H7: Quality Ratings ==========
      const totalRatings = allRatings.length;
      const highRatings = allRatings.filter(
        (r) => (r.quality_score + r.communication_score + r.timing_score) / 3 >= 4
      ).length;
      const ratingPct = totalRatings > 0 ? Math.round((highRatings / totalRatings) * 100) : null;

      const completedOrDisputed = allProjects.filter((p) => p.status === "completed" || p.status === "disputed").length;
      const complaintsPct = completedOrDisputed > 0
        ? Math.round((allDisputes.length / completedOrDisputed) * 100)
        : null;

      const h7 = {
        ratingPct,
        complaintsPct,
        totalRatings,
        totalProjects: completedOrDisputed,
        totalDisputes: allDisputes.length,
      };

      // ========== H8: Disputes Resolution ==========
      const completedProjects = allProjects.filter((p) => p.status === "completed").length;
      const disputedProjects = allProjects.filter((p) => p.status === "disputed").length;
      const totalDone = completedProjects + disputedProjects;
      const noDisputePct = totalDone > 0 ? Math.round((completedProjects / totalDone) * 100) : null;

      // Resolution times from dispute_status_log
      const resolvedDisputes: number[] = [];
      const disputeCreatedMap = new Map(allDisputes.map((d) => [d.id, d.created_at]));

      allDisputeLogs.forEach((log: any) => {
        if (log.new_status === "resolved" || log.new_status === "closed") {
          const createdAt = disputeCreatedMap.get(log.dispute_id);
          if (createdAt) {
            resolvedDisputes.push(diffDays(createdAt, log.created_at));
          }
        }
      });

      const avgResolutionDays = resolvedDisputes.length > 0
        ? Math.round(resolvedDisputes.reduce((s, v) => s + v, 0) / resolvedDisputes.length * 10) / 10
        : null;
      const pctResolvedIn7 = resolvedDisputes.length > 0
        ? Math.round((resolvedDisputes.filter((d) => d <= 7).length / resolvedDisputes.length) * 100)
        : null;

      const h8 = { noDisputePct, avgResolutionDays, pctResolvedIn7, totalDone, totalDisputes: allDisputes.length };

      // ========== H9: On-time Delivery & Repeat ==========
      const avgTimingScore = totalRatings > 0
        ? Math.round((allRatings.reduce((s, r) => s + r.timing_score, 0) / totalRatings) * 10) / 10
        : null;

      // Repeat purchase: associations with 2+ completed projects
      const assocProjectCount = new Map<string, number>();
      allProjects.filter((p) => p.status === "completed").forEach((p) => {
        assocProjectCount.set(p.association_id, (assocProjectCount.get(p.association_id) ?? 0) + 1);
      });
      const totalAssocWithCompleted = assocProjectCount.size;
      const repeatAssociations = [...assocProjectCount.values()].filter((c) => c >= 2).length;
      const repeatPurchasePct = totalAssocWithCompleted > 0
        ? Math.round((repeatAssociations / totalAssocWithCompleted) * 100)
        : null;

      const h9 = {
        avgTimingScore,
        repeatPurchasePct,
        totalRatings,
        repeatAssociations,
        totalAssociationsWithCompleted: totalAssocWithCompleted,
      };

      // ========== H10: Response incentives (same data as H2) ==========
      const h10 = {
        avgHoursToFirstBid: h2.avgHoursToFirstBid,
        closureCorrelation: closureWithFast !== null && closureWithSlow !== null
          ? closureWithFast > closureWithSlow ? "إيجابي ↑" : closureWithFast === closureWithSlow ? "متساوي" : "سلبي ↓"
          : "بيانات غير كافية",
      };

      // ========== H11: Repeat requests per association ==========
      const assocAllProjectCount = new Map<string, number>();
      allProjects.forEach((p) => {
        if (associationIds.has(p.association_id)) {
          assocAllProjectCount.set(p.association_id, (assocAllProjectCount.get(p.association_id) ?? 0) + 1);
        }
      });
      const activeAssociations = assocAllProjectCount.size;
      const repeatAssoc11 = [...assocAllProjectCount.values()].filter((c) => c >= 2).length;
      const avgRequestsPer90Days = activeAssociations > 0
        ? Math.round(
            (allProjects.filter((p) => p.created_at >= ninetyDaysAgo && associationIds.has(p.association_id)).length /
              activeAssociations) *
              10
          ) / 10
        : null;

      const h11 = {
        avgRequestsPer90Days,
        activeAssociations,
        totalAssociations: associationIds.size,
        repeatAssociations: repeatAssoc11,
      };

      // ========== H12: Registration → First Project ==========
      const assocProfiles = allProfiles.filter((p) => associationIds.has(p.id));
      const assocFirstProject = new Map<string, string>();
      allProjects.forEach((p) => {
        if (!assocFirstProject.has(p.association_id) || p.created_at < assocFirstProject.get(p.association_id)!) {
          assocFirstProject.set(p.association_id, p.created_at);
        }
      });

      const conversionDays: number[] = [];
      assocProfiles.forEach((prof) => {
        const firstProj = assocFirstProject.get(prof.id);
        if (firstProj) {
          conversionDays.push(diffDays(prof.created_at, firstProj));
        }
      });

      const convertedAssociations = conversionDays.length;
      const conversionPct = assocProfiles.length > 0
        ? Math.round((convertedAssociations / assocProfiles.length) * 100)
        : null;
      const avgDaysToFirstProject = conversionDays.length > 0
        ? Math.round(conversionDays.reduce((s, v) => s + v, 0) / conversionDays.length * 10) / 10
        : null;

      const h12 = {
        conversionPct,
        avgDaysToFirstProject,
        totalAssociations: assocProfiles.length,
        convertedAssociations,
      };

      // ========== H14: Service Type ==========
      const fixedServices = allServices.filter((s) => s.service_type === "fixed_price");
      const packageServices = allServices.filter((s) => s.service_type === "packages");
      const fixedAvg = fixedServices.length > 0
        ? Math.round(fixedServices.reduce((s, sv) => s + Number(sv.price), 0) / fixedServices.length)
        : null;
      const packageAvg = packageServices.length > 0
        ? Math.round(packageServices.reduce((s, sv) => s + Number(sv.price), 0) / packageServices.length)
        : null;

      const h14 = {
        fixedCount: fixedServices.length,
        packageCount: packageServices.length,
        fixedAvgValue: fixedAvg,
        packageAvgValue: packageAvg,
      };

      // ========== H15: Bid Rejection ==========
      const totalBidsCount = allBids.length;
      const rejectedBids = allBids.filter((b) => b.status === "rejected").length;
      const rejectionPct = totalBidsCount > 0 ? Math.round((rejectedBids / totalBidsCount) * 100) : null;

      // Avg decision time: project created → first bid accepted
      const acceptedBids = allBids.filter((b) => b.status === "accepted");
      const decisionHours: number[] = [];
      acceptedBids.forEach((b) => {
        const proj = allProjects.find((p) => p.id === b.project_id);
        if (proj) {
          decisionHours.push(diffHours(proj.created_at, b.created_at));
        }
      });
      const avgDecisionHours = decisionHours.length > 0
        ? Math.round(decisionHours.reduce((s, v) => s + v, 0) / decisionHours.length)
        : null;

      const h15 = { rejectionPct, avgDecisionHours, totalBids: totalBidsCount, rejectedBids };

      // ========== H17: Repeat + Support ==========
      const assocCompletedIn120 = new Map<string, string[]>();
      allProjects.filter((p) => p.status === "completed").forEach((p) => {
        if (!assocCompletedIn120.has(p.association_id)) assocCompletedIn120.set(p.association_id, []);
        assocCompletedIn120.get(p.association_id)!.push(p.created_at);
      });

      let repeatIn120 = 0;
      assocCompletedIn120.forEach((dates) => {
        if (dates.length >= 2) {
          dates.sort();
          for (let i = 1; i < dates.length; i++) {
            if (diffDays(dates[i - 1], dates[i]) <= 120) {
              repeatIn120++;
              break;
            }
          }
        }
      });

      const repeatPurchasePct120 = assocCompletedIn120.size > 0
        ? Math.round((repeatIn120 / assocCompletedIn120.size) * 100)
        : null;

      const totalProjectsCount = allProjects.length;
      const avgTicketsPerProject = totalProjectsCount > 0 && ticketCount !== null
        ? Math.round((ticketCount / totalProjectsCount) * 100) / 100
        : null;

      const h17 = {
        repeatPurchasePct120,
        avgTicketsPerProject,
        totalTickets: ticketCount ?? 0,
        totalProjects: totalProjectsCount,
      };

      // ========== H18: Self-Payment ==========
      const activeEscrows = allEscrows.filter((e) => e.status === "held" || e.status === "released");
      const selfPayEscrows = activeEscrows.filter((e) => !e.grant_request_id);
      const selfPayPct = activeEscrows.length > 0
        ? Math.round((selfPayEscrows.length / activeEscrows.length) * 100)
        : null;

      // Monthly trend
      const escrowMonthly = new Map<string, { total: number; self: number }>();
      activeEscrows.forEach((e) => {
        const m = monthKey(e.created_at);
        if (!escrowMonthly.has(m)) escrowMonthly.set(m, { total: 0, self: 0 });
        const entry = escrowMonthly.get(m)!;
        entry.total++;
        if (!e.grant_request_id) entry.self++;
      });

      const escrowTrend = [...escrowMonthly.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, data]) => ({
          month,
          selfPct: data.total > 0 ? Math.round((data.self / data.total) * 100) : 0,
        }));

      const h18 = {
        selfPayPct,
        totalEscrow: activeEscrows.length,
        selfPayCount: selfPayEscrows.length,
        monthlyTrend: escrowTrend,
      };

      // ========== H23: Dispute Resolution ==========
      const h23 = {
        avgResolutionDays,
        pctIn7Days: pctResolvedIn7,
        totalResolved: resolvedDisputes.length,
      };

      // ========== H24: Escrow Impact ==========
      const projectsWithEscrow = new Set(allEscrows.map((e) => e.project_id).filter(Boolean));
      const projWithEscrow = allProjects.filter((p) => projectsWithEscrow.has(p.id));
      const projWithoutEscrow = allProjects.filter((p) => !projectsWithEscrow.has(p.id) && p.status !== "draft");

      const closureWithEscrow = projWithEscrow.length > 0
        ? Math.round((projWithEscrow.filter((p) => p.status === "completed").length / projWithEscrow.length) * 100)
        : null;
      const closureWithout = projWithoutEscrow.length > 0
        ? Math.round((projWithoutEscrow.filter((p) => p.status === "completed").length / projWithoutEscrow.length) * 100)
        : null;

      const disputeProjectIds = new Set(allDisputes.map((d) => d.project_id));
      const disputesWithEscrowPct = projWithEscrow.length > 0
        ? Math.round((projWithEscrow.filter((p) => disputeProjectIds.has(p.id)).length / projWithEscrow.length) * 100)
        : null;
      const disputesWithoutPct = projWithoutEscrow.length > 0
        ? Math.round((projWithoutEscrow.filter((p) => disputeProjectIds.has(p.id)).length / projWithoutEscrow.length) * 100)
        : null;

      const h24 = {
        closureWithEscrow,
        closureWithout,
        disputesWithEscrowPct,
        disputesWithoutPct,
        projectsWithEscrow: projWithEscrow.length,
        projectsWithout: projWithoutEscrow.length,
      };

      // ========== H25: Profile Completeness ==========
      const completenessFields = [
        "full_name", "bio", "phone", "skills", "region_id", "city_id",
        "avatar_url", "organization_name", "license_number", "bank_iban",
      ];
      const completenessScores = allProfiles.map((p: any) => {
        const filled = completenessFields.filter((f) => {
          const val = p[f];
          if (val === null || val === undefined || val === "") return false;
          if (Array.isArray(val) && val.length === 0) return false;
          return true;
        }).length;
        return filled / completenessFields.length;
      });

      const avgCompleteness = completenessScores.length > 0
        ? Math.round((completenessScores.reduce((s, v) => s + v, 0) / completenessScores.length) * 100)
        : null;
      const fullyComplete = completenessScores.filter((s) => s >= 0.9).length;

      const h25 = { avgCompleteness, totalProfiles: allProfiles.length, fullyComplete };

      return { h1, h2, h3, h5, h7, h8, h9, h10, h11, h12, h14, h15, h17, h18, h23, h24, h25 };
    },
    staleTime: 60_000,
  });
}
