import { Separator } from "@/components/ui/separator";
import type { PricingBreakdown, PricingWithDiscount } from "@/lib/pricing";

interface PricingBreakdownDisplayProps {
 pricing: PricingBreakdown | PricingWithDiscount;
 className?: string;
}

function isWithDiscount(p: PricingBreakdown | PricingWithDiscount): p is PricingWithDiscount {
 return "discount" in p && (p as PricingWithDiscount).discount > 0;
}

export function PricingBreakdownDisplay({ pricing, className }: PricingBreakdownDisplayProps) {
 const hasDiscount = isWithDiscount(pricing);

 return (
 <div className={className}>
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">المبلغ الأساسي</span>
 <span>{pricing.subtotal.toLocaleString()} ر.س</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">
 رسوم المنصة ({(pricing.commissionRate * 100).toFixed(0)}%)
 </span>
 <span>{pricing.commission.toLocaleString()} ر.س</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">ضريبة القيمة المضافة (15%)</span>
 <span>{pricing.vat.toLocaleString()} ر.س</span>
 </div>
 {hasDiscount && (
 <div className="flex justify-between text-primary">
 <span>كود الخصم</span>
 <span className="font-bold">−{pricing.discount.toLocaleString()} ر.س</span>
 </div>
 )}
 </div>
 <Separator className="my-2" />
 <div className="flex justify-between font-bold text-lg">
 <span>الإجمالي</span>
 <span className="text-primary">{pricing.total.toLocaleString()} ر.س</span>
 </div>
 {hasDiscount && (
 <p className="text-xs text-muted-foreground mt-1">
 مستحقات المزود: {pricing.originalSubtotal.toLocaleString()} ر.س (كامل المبلغ الأصلي)
 </p>
 )}
 </div>
 );
}
