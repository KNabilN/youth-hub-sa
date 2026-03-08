import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminFinancePending } from "@/hooks/useAdminFinancePending";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle, Layers, Ticket, CreditCard, FolderKanban, Gavel } from "lucide-react";

interface ActionItem {
  icon: React.ElementType;
  label: string;
  count: number;
  to: string;
  color: string;
}

export function AdminActionItems() {
  const { data: stats } = useAdminStats();
  const { data: finance } = useAdminFinancePending();

  const items: ActionItem[] = [
    { icon: Layers, label: "خدمات بانتظار الموافقة", count: stats?.pendingServices ?? 0, to: "/admin/services", color: "text-warning" },
    { icon: FolderKanban, label: "طلبات بانتظار الموافقة", count: stats?.pendingProjects ?? 0, to: "/admin/projects", color: "text-info" },
    { icon: CreditCard, label: "طلبات سحب معلقة", count: finance?.withdrawals ?? 0, to: "/admin/finance", color: "text-primary" },
    { icon: CreditCard, label: "تحويلات بنكية معلقة", count: finance?.bankTransfers ?? 0, to: "/admin/finance", color: "text-primary" },
    { icon: Ticket, label: "تذاكر دعم مفتوحة", count: stats?.openTickets ?? 0, to: "/admin/tickets", color: "text-warning" },
    { icon: Gavel, label: "شكاوى مفتوحة", count: stats?.openDisputes ?? 0, to: "/admin/disputes", color: "text-destructive" },
  ];

  const active = items.filter((i) => i.count > 0);
  if (active.length === 0) return null;

  return (
    <Alert className="border-warning/40 bg-warning/5">
      <AlertTriangle className="h-5 w-5 text-warning" />
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
