import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ExternalLink, Package, FolderOpen } from "lucide-react";

interface Props {
  providerId: string;
}

export function WithdrawalEscrowDetails({ providerId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["provider-escrows", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escrow_transactions")
        .select("id, amount, status, created_at, escrow_number, service_id, project_id, micro_services:service_id(title, service_number), projects:project_id(title, request_number)")
        .eq("payee_id", providerId)
        .in("status", ["released", "held", "frozen"])
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        لا توجد معاملات ضمان لهذا المزود
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    released: "محرر",
    held: "محتجز",
    frozen: "مجمد",
  };
  const statusColors: Record<string, string> = {
    released: "bg-emerald-500/10 text-emerald-600",
    held: "bg-yellow-500/10 text-yellow-600",
    frozen: "bg-blue-500/10 text-blue-600",
  };

  return (
    <div className="p-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground mb-3">معاملات الضمان المالي (آخر 10)</p>
      <div className="space-y-2">
        {data.map((e: any) => {
          const service = e.micro_services;
          const project = e.projects;
          return (
            <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3 text-sm">
              <div className="flex-1 min-w-0 space-y-1">
                {service && (
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                    <Link to={`/admin/services/${e.service_id}`} className="text-primary hover:underline font-medium truncate">
                      {service.title}
                    </Link>
                    <span className="text-[10px] text-muted-foreground font-mono">{service.service_number}</span>
                  </div>
                )}
                {project && (
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-accent-foreground shrink-0" />
                    <Link to={`/admin/projects/${e.project_id}`} className="text-primary hover:underline font-medium truncate">
                      {project.title}
                    </Link>
                    <span className="text-[10px] text-muted-foreground font-mono">{project.request_number}</span>
                  </div>
                )}
                {!service && !project && (
                  <span className="text-muted-foreground">معاملة عامة</span>
                )}
              </div>
              <div className="text-end shrink-0 space-y-0.5">
                <p className="font-semibold">{Number(e.amount).toLocaleString()} ر.س</p>
                <p className="text-[10px] text-muted-foreground">{format(new Date(e.created_at), "yyyy/MM/dd", { locale: ar })}</p>
              </div>
              <Badge className={`shrink-0 text-[10px] ${statusColors[e.status] ?? ""}`}>
                {statusLabels[e.status] ?? e.status}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
