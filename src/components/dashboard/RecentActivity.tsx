import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  Bell, FileText, Check, AlertTriangle, HandCoins, Gavel, FolderKanban, ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const typeIcons: Record<string, typeof Bell> = {
  bid_accepted: FileText,
  bid_rejected: FileText,
  contract_signed: Check,
  escrow_created: ShieldCheck,
  project_completed: FolderKanban,
  project_cancelled: FolderKanban,
  dispute_opened: Gavel,
  dispute_resolved: Gavel,
  donation: HandCoins,
  info: Bell,
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">النشاط الأخير</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/notifications")}>
          عرض الكل
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !notifications?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا يوجد نشاط حتى الآن</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] ?? Bell;
              return (
                <div key={n.id} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-muted p-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
