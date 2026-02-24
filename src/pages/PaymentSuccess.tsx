import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SuccessAnimation } from "@/components/ui/success-animation";
import { StepProgress } from "@/components/ui/step-progress";
import { ArrowLeft, Receipt } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const checkoutSteps = [
  { label: "السلة" },
  { label: "المراجعة" },
  { label: "الدفع" },
  { label: "التأكيد" },
];

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { total?: number; count?: number } | null;

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <StepProgress steps={checkoutSteps} currentStep={4} className="mb-4" />

        <Card className="max-w-md w-full animate-fade-in">
          <CardContent className="flex flex-col items-center text-center py-10 px-8 space-y-6">
            <SuccessAnimation
              title="تم الدفع بنجاح!"
              description="تم تأكيد طلبك وحجز المبلغ في نظام الضمان المالي"
            />

            {state && (
              <div className="bg-muted/50 rounded-lg p-4 w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">عدد الخدمات</span>
                  <span className="font-medium">{state.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الإجمالي المدفوع</span>
                  <span className="font-bold text-primary">
                    {state.total?.toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              <Button onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 ml-1" />
                العودة للوحة التحكم
              </Button>
              <Button variant="outline" onClick={() => navigate("/invoices")}>
                <Receipt className="h-4 w-4 ml-1" />
                عرض الفواتير
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
