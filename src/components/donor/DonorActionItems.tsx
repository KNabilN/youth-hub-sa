import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle, Inbox, BarChart3 } from "lucide-react";

export function DonorActionItems() {
  const { user } = useAuth();

  const { data: pendingRequests } = useQuery({
    queryKey: ["donor-pending-grant-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("grant_requests")
        .select("id", { count: "exact", head: true })
        .eq("donor_id", user!.id)
        .in("status", ["pending", "approved"]);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: newReports } = useQuery({
    queryKey: ["donor-new-impact-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("impact_reports")
        .select("id", { count: "exact", head: true })
        .eq("donor_id", user!.id)
        .gte("created_at", weekAgo);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const items = [
    { icon: Inbox, label: "طلبات واردة بانتظار الرد", count: pendingRequests ?? 0, to: "/my-grant-requests", color: "text-primary" },
    { icon: BarChart3, label: "تقارير أثر جديدة", count: newReports ?? 0, to: "/impact-reports", color: "text-success" },
  ];

  const active = items.filter((i) => i.count > 0);
  if (active.length === 0) return null;

  return (
    <Alert className="border-primary/40 bg-primary/5">
      <AlertTriangle className="h-5 w-5 text-primary" />
      <AlertTitle className="text-base font-bold">إجراءات مطلوبة</AlertTitle>
      <AlertDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          {active.map((item) => (
            <Button key={item.label} variant="outline" size="sm" asChild className="gap-1.5 h-8">
              <Link to={item.to}>
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                <span>{item.label}</span>
                <span className="bg-destructive/10 text-destructive rounded-full px-1.5 text-xs font-bold">{item.count}</span>
              </Link>
            </Button>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
