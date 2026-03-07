import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEscrowTransactions, useInvoices } from "@/hooks/useAdminFinance";
import { DollarSign, Lock, Unlock, BarChart3, Snowflake, RotateCcw, Info, Receipt } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

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
  const vatRevenue = (invoices ?? []).reduce((s: number, i: any) => s + Number(i.vat_amount ?? 0), 0);

  const items = [
    { title: "الضمان المحتجز", value: held, icon: Lock, color: "text-yellow-600", description: "مبالغ محجوزة بانتظار اكتمال الطلب وتأكيد التسليم" },
    { title: "الضمان المجمّد", value: frozen, icon: Snowflake, color: "text-blue-600", description: "مبالغ تم تجميدها مؤقتاً بسبب شكوى أو مراجعة إدارية" },
    { title: "المبالغ المحرّرة", value: released, icon: Unlock, color: "text-emerald-600", description: "مبالغ تم تحريرها لمقدمي الخدمات بعد اكتمال الطلب بنجاح" },
    { title: "المبالغ المستردة", value: refunded, icon: RotateCcw, color: "text-muted-foreground", description: "مبالغ تم إعادتها للجمعيات بعد إلغاء أو رفض الطلب" },
    { title: "إيرادات العمولات", value: commissions, icon: DollarSign, color: "text-primary", description: "إجمالي العمولات المحصّلة من المنصة على جميع المعاملات المكتملة" },
    { title: "إيرادات الضريبة (15%)", value: vatRevenue, icon: Receipt, color: "text-orange-600", description: "إجمالي ضريبة القيمة المضافة المحصّلة على جميع المعاملات" },
    { title: "عدد الفواتير الصادرة", value: invoices?.length ?? 0, icon: BarChart3, color: "text-info", description: "إجمالي عدد الفواتير الإلكترونية التي تم إصدارها عبر المنصة" },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
        {items.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    {item.description}
                  </TooltipContent>
                </Tooltip>
              </div>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent className="text-start">
              <div className="text-2xl font-bold">
                {typeof item.value === "number" && item.title !== "عدد الفواتير الصادرة"
                  ? `${item.value.toLocaleString()} ر.س`
                  : item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
