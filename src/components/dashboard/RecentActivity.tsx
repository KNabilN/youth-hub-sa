import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  Bell, FileText, Check, ShieldCheck, FolderKanban, HandCoins, Gavel,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  bid_received: { icon: FileText, color: "bg-primary/15 text-primary" },
  bid_accepted: { icon: Check, color: "bg-success/15 text-success" },
  bid_rejected: { icon: FileText, color: "bg-destructive/15 text-destructive" },
  contract_created: { icon: FileText, color: "bg-primary/15 text-primary" },
  contract_signed: { icon: Check, color: "bg-success/15 text-success" },
  escrow_created: { icon: ShieldCheck, color: "bg-primary/15 text-primary" },
  escrow_released: { icon: HandCoins, color: "bg-success/15 text-success" },
  escrow_refunded: { icon: HandCoins, color: "bg-muted text-muted-foreground" },
  escrow_frozen: { icon: ShieldCheck, color: "bg-destructive/15 text-destructive" },
  project_open: { icon: FolderKanban, color: "bg-primary/15 text-primary" },
  project_in_progress: { icon: FolderKanban, color: "bg-info/15 text-info" },
  project_completed: { icon: FolderKanban, color: "bg-success/15 text-success" },
  project_cancelled: { icon: FolderKanban, color: "bg-muted text-muted-foreground" },
  project_disputed: { icon: Gavel, color: "bg-destructive/15 text-destructive" },
  project_suspended: { icon: FolderKanban, color: "bg-destructive/15 text-destructive" },
  dispute_opened: { icon: Gavel, color: "bg-destructive/15 text-destructive" },
  dispute_resolved: { icon: Gavel, color: "bg-success/15 text-success" },
  timelog_approved: { icon: Check, color: "bg-success/15 text-success" },
  timelog_rejected: { icon: FileText, color: "bg-destructive/15 text-destructive" },
  withdrawal_approved: { icon: HandCoins, color: "bg-success/15 text-success" },
  withdrawal_processed: { icon: HandCoins, color: "bg-success/15 text-success" },
  purchase: { icon: HandCoins, color: "bg-accent/15 text-accent-foreground" },
  info: { icon: Bell, color: "bg-muted text-muted-foreground" },
};

export function RecentActivity() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["recent-activity", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">النشاط الأخير</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/notifications")}>
          عرض الكل
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : !notifications?.length ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
              <Bell className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">لا يوجد نشاط حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const config = typeConfig[n.type] ?? typeConfig.info;
              const Icon = config.icon;
              return (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className={cn("mt-0.5 rounded-xl p-2", config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
