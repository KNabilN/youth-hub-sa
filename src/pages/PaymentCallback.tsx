import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  // Use a ref to prevent React Strict Mode from double-firing the verify function
  const hasVerified = useRef(false);

  const getPaymentContext = () => {
    const sessionCtx = sessionStorage.getItem("moyasar_payment_context");
    if (sessionCtx) {
      try {
        return JSON.parse(sessionCtx);
      } catch {}
    }
    const ctxParam = searchParams.get("ctx");
    if (ctxParam) {
      try {
        return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(ctxParam)))));
      } catch {}
    }
    return {};
  };

  const paymentContext = getPaymentContext();
  const retryPath =
    paymentContext?.type === "donation"
      ? "/donations"
      : paymentContext?.type === "project_payment"
        ? `/projects/${paymentContext.project_id}`
        : "/checkout";

  useEffect(() => {
    if (hasVerified.current) return;

    const paymentId = searchParams.get("id");
    const paymentStatus = searchParams.get("status");

    if (!paymentId) {
      setStatus("failed");
      setErrorMsg("لم يتم العثور على معرف الدفعة");
      return;
    }

    if (paymentStatus !== "paid") {
      setStatus("failed");
      setErrorMsg("لم تتم عملية الدفع بنجاح. يمكنك المحاولة مرة أخرى.");
      return;
    }

    hasVerified.current = true;
    const context = paymentContext;

    const verify = async () => {
      try {
        let retries = 0;
        let session = null;
        while (retries < 10) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            session = data.session;
            break;
          }
          await new Promise((r) => setTimeout(r, 500));
          retries++;
        }

        if (!session) {
          setStatus("failed");
          setErrorMsg("انتهت صلاحية الجلسة. يرجى تسجيل الدخول والمحاولة مرة أخرى.");
          return;
        }

        const { data, error } = await supabase.functions.invoke("moyasar-verify-payment", {
          body: { payment_id: paymentId, context },
        });

        if (error) throw error;

        if (data?.verified) {
          sessionStorage.removeItem("moyasar_payment_context");

          if (context.type === "project_payment") {
            navigate(`/projects/${context.project_id}`, {
              replace: true,
              state: { paymentSuccess: true },
            });
          } else {
            // ✅ THE FIX: Ensure the amount is divided by 100 to convert Halalas back to SAR
            // We pull the amount from the URL parameters first as the source of truth from Moyasar
            const urlAmount = searchParams.get("amount");
            const rawAmount = urlAmount ? Number(urlAmount) : data.amount || context.total || 0;
            const totalSAR = rawAmount / 100;

            const count = context.items?.length || 1;
            navigate("/payment-success", {
              replace: true,
              state: { total: totalSAR, count, method: "electronic" },
            });
          }
        } else {
          setStatus("failed");
          setErrorMsg(data?.message || "فشل التحقق من الدفع");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("failed");
        setErrorMsg("حدث خطأ أثناء التحقق من الدفع. حاول مرة أخرى.");
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-10 px-8 space-y-6">
            {status === "verifying" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">جاري التحقق من الدفع</h2>
                  <p className="text-sm text-muted-foreground">يرجى الانتظار بينما نتأكد من إتمام عملية الدفع...</p>
                </div>
              </>
            )}

            {status === "failed" && (
              <>
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">فشل عملية الدفع</h2>
                  <p className="text-sm text-muted-foreground">{errorMsg}</p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <Button onClick={() => navigate(retryPath)}>إعادة المحاولة</Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft className="h-4 w-4 me-1" />
                    العودة للوحة التحكم
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
