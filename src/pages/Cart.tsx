import { DashboardLayout } from "@/components/DashboardLayout";
import { useCartItems, useRemoveFromCart, useClearCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Trash2, CreditCard, ArrowLeft, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Cart() {
  const { data: items, isLoading } = useCartItems();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();
  const navigate = useNavigate();

  const total = items?.reduce((sum, item) => sum + item.micro_services.price * item.quantity, 0) ?? 0;

  const handleRemove = (id: string) => {
    removeItem.mutate(id, {
      onSuccess: () => toast.success("تم إزالة العنصر من السلة"),
    });
  };

  const handleClearCart = () => {
    clearCart.mutate(undefined, {
      onSuccess: () => toast.success("تم تفريغ السلة"),
    });
  };

  return (
    <DashboardLayout>
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
                {items?.length ?? 0} عنصر في السلة
              </p>
            </div>
          </div>
          {(items?.length ?? 0) > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearCart} disabled={clearCart.isPending}>
              <Trash2 className="h-4 w-4 ml-1" />
              تفريغ السلة
            </Button>
          )}
        </div>

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
        ) : !items?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted p-4 rounded-full mb-4">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">السلة فارغة</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                لم تضف أي خدمات إلى السلة بعد. تصفح سوق الخدمات لإضافة خدمات.
              </p>
              <Button onClick={() => navigate("/marketplace")}>
                <ArrowLeft className="h-4 w-4 ml-1" />
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
                      {item.micro_services.image_url ? (
                        <img
                          src={item.micro_services.image_url}
                          alt={item.micro_services.title}
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
                            <h3 className="font-semibold truncate">{item.micro_services.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.micro_services.profiles?.full_name}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(item.id)}
                            disabled={removeItem.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline">
                            {item.micro_services.service_type === "fixed_price" ? "سعر ثابت" : "بالساعة"}
                          </Badge>
                          <span className="font-bold text-primary">
                            {item.micro_services.price.toLocaleString()} ر.س
                          </span>
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
                          {item.micro_services.title}
                        </span>
                        <span>{item.micro_services.price.toLocaleString()} ر.س</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-primary">{total.toLocaleString()} ر.س</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => navigate("/checkout")}
                  >
                    <CreditCard className="h-4 w-4 ml-2" />
                    إتمام الشراء
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/marketplace")}
                  >
                    متابعة التسوق
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
