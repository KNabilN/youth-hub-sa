import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Banknote, Lock, ArrowDownCircle, ReceiptText } from "lucide-react";

interface DisputeFinancialImpactProps {
  projectId: string;
}

export function DisputeFinancialImpact({ projectId }: DisputeFinancialImpactProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["dispute-financial-impact", projectId],
    queryFn: async () => {
      const { data: escrows, error } = await supabase
        .from("escrow_transactions")
        .select("amount, status")
        .eq("project_id", projectId);
      if (error) throw error;

      const { data: invoices, error: invErr } = await supabase
        .from("invoices")
        .select("commission_amount, escrow_id")
        .in("escrow_id", (escrows ?? []).map(e => (e as any).id).filter(Boolean));

      let frozen = 0, released = 0, refunded = 0, held = 0;
      (escrows ?? []).forEach(e => {
        const amount = Number(e.amount);
        if (e.status === "frozen") frozen += amount;
        else if (e.status === "released") released += amount;
        else if (e.status === "refunded") refunded += amount;
        else if (e.status === "held") held += amount;
      });

      const commission = (invoices ?? []).reduce((s, i) => s + Number(i.commission_amount), 0);

      return { frozen, released, refunded, held, commission };
    },
    enabled: !!projectId,
  });

  if (isLoading || !data) return null;
  const { frozen, released, refunded, held, commission } = data;
  const total = frozen + released + refunded + held;
  if (total === 0) return null;

  const items = [
    { label: "مبلغ معلق/مجمد", value: frozen + held, icon: Lock, color: "text-warning" },
    { label: "مبلغ مصروف", value: released, icon: Banknote, color: "text-success" },
    { label: "مبلغ مسترد", value: refunded, icon: ArrowDownCircle, color: "text-destructive" },
    { label: "عمولة المنصة", value: commission, icon: ReceiptText, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
  );
}
