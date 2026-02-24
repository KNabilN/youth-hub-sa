import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCartItems, useClearCart } from "@/hooks/useCart";
import { usePurchaseService } from "@/hooks/usePurchaseService";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StepProgress } from "@/components/ui/step-progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreditCard, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const checkoutSteps = [
  { label: "السلة" },
  { label: "المراجعة" },
  { label: "الدفع" },
  { label: "التأكيد" },
];

export default function Checkout() {
  const { user } = useAuth();
  const { data: items, isLoading } = useCartItems();
  const purchase = usePurchaseService();
  const clearCart = useClearCart();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const total = items?.reduce((sum, item) => sum + item.micro_services.price * item.quantity, 0) ?? 0;

  const handleCheckout = async () => {
    if (!user || !items?.length) return;
    setConfirmOpen(false);
    setProcessing(true);

    try {
      for (const item of items) {
        await purchase.mutateAsync({
          serviceId: item.micro_services.id,
          providerId: item.micro_services.provider_id,
          buyerId: user.id,
          amount: item.micro_services.price,
        });
      }
      await clearCart.mutateAsync();
      navigate("/payment-success", { state: { total, count: items.length } });
    } catch (err) {
      toast.error("حدث خطأ أثناء معالجة الدفع. حاول مرة أخرى.");
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!items?.length) {
    navigate("/cart");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Step Progress */}
        <StepProgress steps={checkoutSteps} currentStep={2} className="mb-2" />

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cart")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إتمام الشراء</h1>
            <p className="text-sm text-muted-foreground">مراجعة الطلب وتأكيد الدفع</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Order Details */}
          <div className="md:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  تفاصيل الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {item.micro_services.image_url ? (
                      <img
                        src={item.micro_services.image_url}
                        alt={item.micro_services.title}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.micro_services.title}</p>
                      <p className="text-xs text-muted-foreground">{item.micro_services.profiles?.full_name}</p>
                    </div>
                    <span className="font-bold text-sm">
                      {item.micro_services.price.toLocaleString()} ر.س
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>سيتم حجز المبلغ في نظام الضمان المالي حتى إتمام الخدمة</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="md:col-span-2">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">ملخص الدفع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد الخدمات</span>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span>{total.toLocaleString()} ر.س</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span className="text-primary">{total.toLocaleString()} ر.س</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setConfirmOpen(true)}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جارٍ المعالجة...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 ml-2" />
                      تأكيد الدفع — {total.toLocaleString()} ر.س
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center">
                  بالنقر على "تأكيد الدفع" فإنك توافق على شروط الاستخدام وسياسة الخصوصية
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="تأكيد عملية الدفع"
          description={`هل تريد تأكيد دفع ${total.toLocaleString()} ر.س مقابل ${items.length} خدمات؟ سيتم حجز المبلغ في نظام الضمان.`}
          confirmLabel="تأكيد الدفع"
          cancelLabel="مراجعة الطلب"
          loading={processing}
          onConfirm={handleCheckout}
        />
      </div>
    </DashboardLayout>
  );
}
