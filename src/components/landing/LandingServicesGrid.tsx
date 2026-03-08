import { Link, useNavigate } from "react-router-dom";
import { Store, User, Tag, Banknote, ArrowLeft, Eye, ShoppingCart, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { toast } from "sonner";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  service_type: string;
  image_url: string | null;
  approval: string;
  is_featured?: boolean;
  sales_count?: number | null;
  category: { name: string } | null;
  region: { name: string } | null;
  provider: { full_name: string } | null;
}

interface LandingServicesGridProps {
  services: Service[];
  loading: boolean;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  isLoggedIn?: boolean;
}

const typeLabel: Record<string, string> = {
  fixed_price: "سعر ثابت",
  hourly: "بالساعة",
};

export default function LandingServicesGrid({ services, loading, title, subtitle, buttonText, isLoggedIn }: LandingServicesGridProps) {
  const { addItem, items, isAdding } = useUnifiedCart();
  const navigate = useNavigate();
  const cartServiceIds = new Set(items.map((i) => i.service_id));

  if (!loading && services.length === 0) return null;

  const handleAdd = (serviceId: string) => {
    addItem(serviceId);
    toast.success("تمت إضافة الخدمة إلى السلة");
  };

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-2">
            <Store className="w-4 h-4" />
            <span>خدمات معتمدة</span>
          </div>
          <h2 className="text-3xl font-bold">{title || "الخدمات المتوفرة"}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {subtitle || "خدمات معتمدة من مقدمي خدمات محترفين"}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {services.map((s) => (
              <Card key={s.id} className="card-hover group overflow-hidden relative">
                {(s as any).is_featured && (
                  <div className="absolute top-2 start-2 z-10">
                    <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-500 text-white border-0 text-xs">
                      <Star className="w-3 h-3 fill-white" />
                      مميزة
                    </Badge>
                  </div>
                )}
                {s.image_url && (
                  <div className="w-full h-40 overflow-hidden">
                    <img src={s.image_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base truncate">{s.title}</CardTitle>
                    <Badge variant="outline" className="shrink-0">
                      {typeLabel[s.service_type] || s.service_type}
                    </Badge>
                  </div>
                  {s.provider && (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                          {s.provider.full_name?.[0] || "؟"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{s.provider.full_name}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-sm">
                      {s.price.toLocaleString("ar-SA")} ر.س
                    </div>
                    <div className="flex gap-1.5">
                      {s.category && <Badge variant="secondary" className="text-xs">{s.category.name}</Badge>}
                      {s.region && <Badge variant="secondary" className="text-xs">{s.region.name}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={`/services/${s.id}`}>
                        <Eye className="h-4 w-4 me-1" />
                        التفاصيل
                      </Link>
                    </Button>
                    {cartServiceIds.has(s.id) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => navigate("/cart")}
                      >
                        <Check className="h-4 w-4 me-1" />
                        عرض السلة
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAdd(s.id)}
                        disabled={isAdding}
                      >
                        <ShoppingCart className="h-4 w-4 me-1" />
                        أضف للسلة
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button asChild size="lg" className="gap-2 rounded-xl px-8 text-base shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-shadow">
            <Link to="/auth?mode=register">
              {buttonText || "تصفح جميع الخدمات"}
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
