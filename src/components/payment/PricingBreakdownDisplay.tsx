import { Separator } from "@/components/ui/separator";
import type { PricingBreakdown } from "@/lib/pricing";

interface PricingBreakdownDisplayProps {
  pricing: PricingBreakdown;
  className?: string;
}

export function PricingBreakdownDisplay({ pricing, className }: PricingBreakdownDisplayProps) {
  return (
    <div className={className}>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">المجموع الفرعي</span>
          <span>{pricing.subtotal.toLocaleString()} ر.س</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            رسوم المنصة ({(pricing.commissionRate * 100).toFixed(0)}%)
          </span>
          <span>{pricing.commission.toLocaleString()} ر.س</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ضريبة القيمة المضافة (15% من المبلغ)</span>
          <span>{pricing.vat.toLocaleString()} ر.س</span>
        </div>
      </div>
      <Separator className="my-2" />
      <div className="flex justify-between font-bold text-lg">
        <span>الإجمالي</span>
        <span className="text-primary">{pricing.total.toLocaleString()} ر.س</span>
      </div>
    </div>
  );
}
