import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { FolderOpen, Package } from "lucide-react";

interface Props {
  escrow: {
    id: string;
    amount: number;
    status: string;
    escrow_number: string;
    project_id?: string | null;
    service_id?: string | null;
    projects?: { title: string; request_number?: string } | null;
    micro_services?: { title: string; service_number?: string } | null;
  } | null;
  providerId?: string;
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

export function WithdrawalEscrowDetails({ escrow }: Props) {
  if (!escrow) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        لا توجد معاملة ضمان مرتبطة
      </div>
    );
  }

  const project = escrow.projects;
  const service = escrow.micro_services;

  return (
    <div className="p-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground mb-3">تفاصيل المعاملة المرتبطة</p>
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3 text-sm">
        <div className="flex-1 min-w-0 space-y-1">
          {project && (
            <div className="flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-accent-foreground shrink-0" />
              <Link to={`/admin/projects/${escrow.project_id}`} className="text-primary hover:underline font-medium truncate">
                {project.title}
              </Link>
              {project.request_number && (
                <span className="text-[10px] text-muted-foreground font-mono">{project.request_number}</span>
              )}
            </div>
          )}
          {service && (
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-primary shrink-0" />
              <Link to={`/admin/services/${escrow.service_id}`} className="text-primary hover:underline font-medium truncate">
                {service.title}
              </Link>
              {service.service_number && (
                <span className="text-[10px] text-muted-foreground font-mono">{service.service_number}</span>
              )}
            </div>
          )}
          {!project && !service && (
            <span className="text-muted-foreground">معاملة عامة</span>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground font-mono">{escrow.escrow_number}</span>
            <Badge className={`text-[10px] ${statusColors[escrow.status] ?? ""}`}>
              {statusLabels[escrow.status] ?? escrow.status}
            </Badge>
          </div>
        </div>
        <div className="text-end shrink-0">
          <p className="font-semibold">{Number(escrow.amount).toLocaleString()} ر.س</p>
        </div>
      </div>
    </div>
  );
}
