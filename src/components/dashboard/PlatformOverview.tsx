import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FolderKanban, Layers, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlatformOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_landing_stats");
      if (error) throw error;
      return data as {
        providers: number;
        associations: number;
        completed_projects: number;
        approved_services: number;
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const items = [
    { label: "مقدمي الخدمة", value: stats?.providers ?? 0, icon: Users, color: "text-primary" },
    { label: "الجمعيات", value: stats?.associations ?? 0, icon: Building2, color: "text-info" },
    { label: "المشاريع المكتملة", value: stats?.completed_projects ?? 0, icon: FolderKanban, color: "text-success" },
    { label: "الخدمات المعتمدة", value: stats?.approved_services ?? 0, icon: Layers, color: "text-warning" },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">مؤشرات المنصة</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <Card key={item.label} className="bg-muted/40 border-dashed">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <item.icon className={cn("h-5 w-5 shrink-0", item.color)} />
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-5 w-10 mb-1" />
                ) : (
                  <p className="text-base sm:text-lg font-bold leading-tight">{item.value.toLocaleString()}</p>
                )}
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
