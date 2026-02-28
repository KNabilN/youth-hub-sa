import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEscrowTransactions, useInvoices } from "@/hooks/useAdminFinance";
import { DollarSign, Lock, Unlock, BarChart3, Snowflake, RotateCcw } from "lucide-react";

export function FinanceSummary() {
  const { data: escrows } = useEscrowTransactions();
  const { data: invoices } = useInvoices();

  const held = (escrows ?? [])
    .filter((e: any) => e.status === "held")
    .reduce((s: number, e: any) => s + Number(e.amount), 0);
  const frozen = (escrows ?? [])
    .filter((e: any) => e.status === "frozen")
    .reduce((s: number, e: any) => s + Number(e.amount), 0);
  const released = (escrows ?? [])
    .filter((e: any) => e.status === "released")
    .reduce((s: number, e: any) => s + Number(e.amount), 0);
  const refunded = (escrows ?? [])
    .filter((e: any) => e.status === "refunded")
    .reduce((s: number, e: any) => s + Number(e.amount), 0);
  const commissions = (invoices ?? []).reduce((s: number, i: any) => s + Number(i.commission_amount), 0);

  const items = [
    { title: "الضمان المحتجز", value: held, icon: Lock, color: "text-yellow-600" },
    { title: "المجمد", value: frozen, icon: Snowflake, color: "text-blue-600" },
    { title: "المبالغ المحررة", value: released, icon: Unlock, color: "text-emerald-600" },
    { title: "المسترد", value: refunded, icon: RotateCcw, color: "text-muted-foreground" },
    { title: "إجمالي العمولات", value: commissions, icon: DollarSign, color: "text-primary" },
    { title: "عدد الفواتير", value: invoices?.length ?? 0, icon: BarChart3, color: "text-info" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
      {items.map((item) => (
        <Card key={item.title}>
          {/* 1. Added space-y-0 to fix the icon vertical alignment issue */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </CardHeader>

          {/* 2. Added text-start to guarantee the numbers anchor to the right */}
          <CardContent className="text-start">
            <div className="text-2xl font-bold">
              {typeof item.value === "number" && item.title !== "عدد الفواتير"
                ? `${item.value.toLocaleString()} ر.س`
                : item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
