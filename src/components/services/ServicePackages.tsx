import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft } from "lucide-react";

interface Package {
  name: string;
  description: string;
  price: number;
  old_price?: number;
}

interface ServicePackagesProps {
  packages: Package[];
  basePrice: number;
  baseDescription: string;
  serviceType: string;
  onAddToCart: () => void;
  canPurchase: boolean;
  isAdding: boolean;
  isInCart?: boolean;
  onGoToCart?: () => void;
}

function CartButton({ isInCart, onGoToCart, onAddToCart, canPurchase, isAdding }: { isInCart?: boolean; onGoToCart?: () => void; onAddToCart: () => void; canPurchase: boolean; isAdding: boolean }) {
  if (isInCart) {
    return (
      <Button className="w-full" variant="outline" onClick={onGoToCart}>
        <ArrowLeft className="h-4 w-4 me-2" />
        اذهب للسلة
      </Button>
    );
  }
  return (
    <Button className="w-full" onClick={onAddToCart} disabled={!canPurchase || isAdding}>
      <ShoppingCart className="h-4 w-4 me-2" />
      {isAdding ? "جارٍ الإضافة..." : "أضف إلى السلة"}
    </Button>
  );
}

export function ServicePackages({ packages, basePrice, baseDescription, serviceType, onAddToCart, canPurchase, isAdding, isInCart, onGoToCart }: ServicePackagesProps) {
  const hasPackages = packages.length > 0;

  if (!hasPackages) {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{serviceType === "hourly" ? "السعر بالساعة" : "السعر"}</p>
          <p className="text-2xl font-bold text-primary">{basePrice.toLocaleString()} ر.س</p>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">{baseDescription}</p>
        <CartButton isInCart={isInCart} onGoToCart={onGoToCart} onAddToCart={onAddToCart} canPurchase={canPurchase} isAdding={isAdding} />
      </div>
    );
  }

  return (
    <Tabs defaultValue="0" className="rounded-xl border bg-card p-4">
      <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${packages.length}, 1fr)` }}>
        {packages.map((pkg, i) => (
          <TabsTrigger key={i} value={String(i)} className="text-xs">
            {pkg.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {packages.map((pkg, i) => (
        <TabsContent key={i} value={String(i)} className="space-y-3 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{pkg.price.toLocaleString()} ر.س</span>
            {pkg.old_price && (
              <span className="text-sm text-muted-foreground line-through">{pkg.old_price.toLocaleString()} ر.س</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{pkg.description}</p>
          <CartButton isInCart={isInCart} onGoToCart={onGoToCart} onAddToCart={onAddToCart} canPurchase={canPurchase} isAdding={isAdding} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
