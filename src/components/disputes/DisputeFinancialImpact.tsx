import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Banknote, Lock, ArrowDownCircle, ReceiptText, AlertTriangle } from "lucide-react";

interface DisputeFinancialImpactProps {
  projectId: string;
}

export function DisputeFinancialImpact({ projectId }: DisputeFinancialImpactProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["dispute-financial-impact", projectId],
    queryFn: async () => {
      const { data: escrows, error } = await supabase
        .from("escrow_transactions")
        .select("id, amount, status")
        .eq("project_id", projectId);
      if (error) throw error;

      const escrowIds = (escrows ?? []).map(e => e.id).filter(Boolean);
      let commission = 0;
      if (escrowIds.length) {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("commission_amount")
          .in("escrow_id", escrowIds);
        commission = (invoices ?? []).reduce((s, i) => s + Number(i.commission_amount), 0);
      }

      let frozen = 0, released = 0, refunded = 0, held = 0, failed = 0;
      (escrows ?? []).forEach(e => {
        const amount = Number(e.amount);
        if (e.status === "frozen") frozen += amount;
        else if (e.status === "released") released += amount;
        else if (e.status === "refunded") refunded += amount;
        else if (e.status === "held") held += amount;
        else if (e.status === "failed") failed += amount;
      });

      return { frozen, released, refunded, held, failed, commission, total: frozen + released + refunded + held + failed };
    },
    enabled: !!projectId,
  });

  if (isLoading || !data || data.total === 0) return null;

  const items = [
    { label: "مجمد", value: data.frozen, icon: Lock, color: "text-warning", show: data.frozen > 0 },
    { label: "محتجز", value: data.held, icon: Lock, color: "text-muted-foreground", show: data.held > 0 },
    { label: "محرر", value: data.released, icon: Banknote, color: "text-success", show: data.released > 0 },
    { label: "مسترد", value: data.refunded, icon: ArrowDownCircle, color: "text-destructive", show: data.refunded > 0 },
    { label: "فاشل", value: data.failed, icon: AlertTriangle, color: "text-destructive", show: data.failed > 0 },
    { label: "عمولة", value: data.commission, icon: ReceiptText, color: "text-primary", show: data.commission > 0 },
  ].filter(i => i.show);

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground">الأثر المالي</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map(item => (
          <Card key={item.label} className="border-dashed">
            <CardContent className="p-3 text-center space-y-1">
              <item.icon className={`h-4 w-4 mx-auto ${item.color}`} />
              <p className="text-sm font-bold">{item.value.toLocaleString()} ر.س</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
