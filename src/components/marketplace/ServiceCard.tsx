import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useAddToCart, useCartItems } from "@/hooks/useCart";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ShoppingCart, Eye, ArrowLeft } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"micro_services"> & {
  categories: Tables<"categories"> | null;
  regions: Tables<"regions"> | null;
  cities: { name: string } | null;
  profiles: { full_name: string } | null;
};

const typeLabel: Record<string, string> = {
  fixed_price: "سعر ثابت",
  hourly: "بالساعة",
};

export function ServiceCard({ service }: { service: Service }) {
  const { user, role } = useAuth();
  const addToCart = useAddToCart();
  const { data: cartItems } = useCartItems();

  const canPurchase = role === "youth_association" || role === "donor";
  const isInCart = cartItems?.some(item => item.service_id === service.id);

  const handleAddToCart = () => {
    if (!user) return;
    addToCart.mutate(service.id, {
      onSuccess: () => toast.success("تمت إضافة الخدمة إلى السلة"),
      onError: () => toast.error("حدث خطأ أثناء الإضافة"),
    });
  };

  return (
    <>
      <Card className="card-hover group overflow-hidden">
        {(() => {
          const displayImage = service.image_url || (service.categories as any)?.image_url;
          return displayImage ? (
            <div className="w-full h-40 overflow-hidden">
              <img src={displayImage} alt={service.title} className="w-full h-full object-cover" />
            </div>
          ) : null;
        })()}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base line-clamp-2 min-h-[2.75rem]">{service.title}</CardTitle>
              {(service as any).service_number && (
                <Link to={`/services/${service.id}`} className="text-xs font-semibold font-mono hover:underline hover:text-primary transition-colors">{(service as any).service_number}</Link>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">{typeLabel[service.service_type] || service.service_type}</Badge>
          </div>
          <Link to={`/profile/${service.provider_id}`} className="flex items-center gap-2 mt-1 hover:opacity-80 transition-opacity">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {service.profiles?.full_name?.[0] || "؟"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground hover:underline">{service.profiles?.full_name}</span>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
          <div className="flex items-center justify-between text-sm">
            <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-sm">
              {service.price.toLocaleString()} ر.س
            </div>
            <div className="flex gap-1.5">
              {service.categories?.name && <Badge variant="secondary" className="text-xs">{service.categories.name}</Badge>}
              {service.regions?.name && <Badge variant="secondary" className="text-xs">{service.regions.name}</Badge>}
              {service.cities?.name && <Badge variant="outline" className="text-xs">{service.cities.name}</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to={`/services/${service.id}`}>
                <Eye className="h-4 w-4 me-1" />
                التفاصيل
              </Link>
            </Button>
            {isInCart ? (
              <Button size="sm" className="flex-1" variant="secondary" asChild>
                <Link to="/cart">
                  <ArrowLeft className="h-4 w-4 me-1" />
                  اذهب للسلة
                </Link>
              </Button>
            ) : (
              <Button size="sm" className="flex-1" onClick={handleAddToCart} disabled={!canPurchase || addToCart.isPending}>
                <ShoppingCart className="h-4 w-4 me-1" />
                {addToCart.isPending ? "إضافة..." : "أضف للسلة"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

    </>
  );
}
