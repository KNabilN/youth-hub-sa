import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SuccessAnimation } from "@/components/ui/success-animation";
import { StepProgress } from "@/components/ui/step-progress";
import { ArrowLeft, Receipt, Clock, CheckCircle2, FileText, ScrollText, PlayCircle, Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const checkoutSteps = [
  { label: "السلة" },
  { label: "المراجعة" },
  { label: "الدفع" },
  { label: "التأكيد" },
];

const bankTransferJourney = [
  { icon: CheckCircle2, label: "تم إرسال الإيصال", status: "done" as const },
  { icon: Clock, label: "بانتظار موافقة الإدارة", status: "current" as const },
  { icon: FileText, label: "إصدار الفاتورة", status: "upcoming" as const },
  { icon: ScrollText, label: "إنشاء العقد وتوقيع المزود", status: "upcoming" as const },
  { icon: PlayCircle, label: "بدء المشروع", status: "upcoming" as const },
];

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const state = location.state as { total?: number; count?: number; method?: string } | null;

  const isBankTransfer = state?.method === "bank_transfer";
  const isDonor = role === "donor";

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <StepProgress steps={checkoutSteps} currentStep={4} className="mb-4" />

        <Card className="max-w-md w-full animate-fade-in">
          <CardContent className="flex flex-col items-center text-center py-10 px-8 space-y-6">
            {isBankTransfer ? (
              <>
                <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">تم إرسال إيصال التحويل</h2>
                  <p className="text-sm text-muted-foreground">
                    سيتم مراجعة إيصال التحويل من قبل الإدارة وسيتم إشعارك بالنتيجة
                  </p>
                </div>

                {/* Journey Timeline */}
                <div className="w-full bg-muted/30 rounded-xl p-4 space-y-0">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">المراحل القادمة</p>
                  {bankTransferJourney.map((step, idx) => {
                    const Icon = step.icon;
                    const isDone = step.status === "done";
                    const isCurrent = step.status === "current";
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isDone
                                ? "bg-primary text-primary-foreground"
                                : isCurrent
                                ? "bg-orange-500/15 text-orange-600 ring-2 ring-orange-500/30"
                                : "bg-muted text-muted-foreground/50"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          {idx < bankTransferJourney.length - 1 && (
                            <div
                              className={`w-0.5 h-6 my-0.5 ${
                                isDone ? "bg-primary" : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-sm pt-1.5 text-right ${
                            isDone
                              ? "text-foreground font-medium"
                              : isCurrent
                              ? "text-orange-600 font-medium"
                              : "text-muted-foreground/60"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : state?.method === "grant_balance" ? (
              <>
                <SuccessAnimation
                  title={isDonor ? "تم تأكيد دعمك بنجاح!" : "تم الدفع من رصيد المنح!"}
                  description={isDonor
                    ? "شكراً لمساهمتك الكريمة. تم تأكيد تبرعك وسيتم إشعارك بتقارير الأثر."
                    : "تم خصم المبلغ من رصيد المنح وحجزه في نظام الضمان المالي. يرجى مراجعة العقد وتوقيعه لبدء التنفيذ."
                  }
                />
              </>
            ) : (
              <>
                <SuccessAnimation
                  title={isDonor ? "تم تأكيد دعمك بنجاح!" : "تم الدفع بنجاح!"}
                  description={isDonor
                    ? "شكراً لمساهمتك الكريمة. تم تأكيد تبرعك وسيتم إشعارك بتقارير الأثر."
                    : "تم تأكيد طلبك وحجز المبلغ في نظام الضمان المالي. يرجى مراجعة العقد وتوقيعه لبدء التنفيذ."
                  }
                />
              </>
            )}

            {state && (
              <div className="bg-muted/50 rounded-lg p-4 w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">عدد الخدمات</span>
                  <span className="font-medium">{state.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isBankTransfer ? "المبلغ المحوّل" : "الإجمالي المدفوع"}
                  </span>
                  <span className="font-bold text-primary">
                    {state.total?.toLocaleString()} ر.س
                  </span>
                </div>
                {isBankTransfer && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الحالة</span>
                    <span className="text-orange-500 font-medium">قيد المراجعة</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              <Button onClick={() => navigate("/contracts")}>
                <ScrollText className="h-4 w-4 me-1" />
                مراجعة العقود وتوقيعها
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 me-1" />
                العودة للوحة التحكم
              </Button>
              {!isBankTransfer && (
                <Button variant="ghost" onClick={() => navigate("/invoices")}>
                  <Receipt className="h-4 w-4 me-1" />
                  عرض الفواتير
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
