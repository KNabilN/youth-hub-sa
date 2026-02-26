import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { HandCoins, FolderKanban, Layers } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  available: { label: "متاح", variant: "default" },
  reserved: { label: "محجوز", variant: "secondary" },
  consumed: { label: "مستهلك", variant: "outline" },
  suspended: { label: "معلق", variant: "destructive" },
  expired: { label: "منتهي", variant: "secondary" },
};

interface Contribution {
  id: string;
  amount: number;
  created_at: string;
  donation_status: string;
  project_id: string | null;
  service_id: string | null;
  association_id: string | null;
  projects?: { title: string } | null;
  micro_services?: { title: string } | null;
  profiles?: { full_name: string; organization_name: string | null } | null;
}

interface DonationTimelineProps {
  contributions: Contribution[];
}

export function DonationTimeline({ contributions }: DonationTimelineProps) {
  if (!contributions.length) return null;

  return (
    <div className="relative space-y-0">
      <div className="absolute top-0 bottom-0 end-4 w-px bg-border" />
      {contributions.map((c, i) => {
        const st = statusConfig[c.donation_status] ?? statusConfig.available;
        const isProject = !!c.project_id;
        const Icon = isProject ? FolderKanban : c.service_id ? Layers : HandCoins;
        const target = (c.projects as any)?.title || (c.micro_services as any)?.title || "منحة عامة";
        const assocName = (c.profiles as any)?.organization_name || (c.profiles as any)?.full_name;

        return (
          <div key={c.id} className="relative flex gap-4 pb-4">
            <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-primary/30 shrink-0">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{target}</p>
                  {assocName && <p className="text-xs text-muted-foreground">لصالح: {assocName}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                  <span className="text-sm font-bold text-primary">{Number(c.amount).toLocaleString()} ر.س</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {format(new Date(c.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
