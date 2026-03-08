import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, CreditCard, ArrowLeft, Package, Clock, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";
import { calculatePricing, useCommissionRate } from "@/lib/pricing";
import { PricingBreakdownDisplay } from "@/components/payment/PricingBreakdownDisplay";

export default function Cart() {
  const {
    items, isLoading, total, isLoggedIn,
    removeItem, clearAll, updateQuantity,
    isRemoving, isClearing,
  } = useUnifiedCart();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const { data: commissionRate = 0.05 } = useCommissionRate();
  const pricing = calculatePricing(total, commissionRate);

  const handleRemove = (id: string) => {
    removeItem(id);
    toast.success("تم إزالة العنصر من السلة");
  };

  const handleClearCart = () => {
    clearAll();
    toast.success("تم تفريغ السلة");
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    navigate("/checkout");
  };

  function lineTotal(item: { price: number; quantity: number }) {
    return item.price * item.quantity;
  }

  const content = (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سلة المشتريات</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {items.length} عنصر في السلة
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearCart} disabled={isClearing}>
            <Trash2 className="h-4 w-4 me-1" />
            تفريغ السلة
          </Button>
        )}
      </div>

      <div className="h-1 w-full rounded-full bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !items.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">السلة فارغة</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              لم تضف أي خدمات إلى السلة بعد. تصفح سوق الخدمات لإضافة خدمات.
            </p>
            <Button onClick={() => navigate(isLoggedIn ? "/marketplace" : "/")}>
              <ArrowLeft className="h-4 w-4 me-1 rtl:-scale-x-100" />
              تصفح الخدمات
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-20 w-20 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.provider_name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(item.id)}
                          disabled={isRemoving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline">
                          {item.service_type === "fixed_price" ? "سعر ثابت" : "بالساعة"}
                        </Badge>
                        {item.service_type === "hourly" ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-2 py-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                type="number"
                                min={1}
                                max={999}
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                                  updateQuantity(item.id, val);
                                }}
                                className="h-7 w-16 text-center text-sm border-0 bg-transparent p-0"
                              />
                              <span className="text-xs text-muted-foreground">ساعة</span>
                            </div>
                            <span className="font-bold text-primary text-sm">
                              {lineTotal(item).toLocaleString()} ر.س
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-primary">
                            {item.price.toLocaleString()} ر.س
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[60%]">
                        {item.title}
                        {item.service_type === "hourly" && (
                          <span className="text-xs"> ({item.quantity} ساعة)</span>
                        )}
                      </span>
                      <span>{lineTotal(item).toLocaleString()} ر.س</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <PricingBreakdownDisplay pricing={pricing} />
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  {isLoggedIn ? (
                    <>
                      <CreditCard className="h-4 w-4 me-2" />
                      إتمام الشراء
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 me-2" />
                      سجل دخولك لإتمام الشراء
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(isLoggedIn ? "/marketplace" : "/")}
                >
                  متابعة التسوق
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Auth modal for guests */}
      <AuthModal
        open={showAuth}
        onOpenChange={setShowAuth}
        defaultMode="login"
      />
    </div>
  );

  // Logged-in: wrap with DashboardLayout; Guest: PublicLayout provides header/footer via route
  if (isLoggedIn) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {content}
    </div>
  );
}
