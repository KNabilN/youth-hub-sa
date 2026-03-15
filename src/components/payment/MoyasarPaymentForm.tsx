import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";

declare global {
  interface Window {
    Moyasar: {
      init: (config: Record<string, unknown>) => void;
    };
  }
}

interface MoyasarPaymentFormProps {
  amount: number;
  description: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  publishableKey: string;
  onCompleted?: (payment: { id: string; status: string }) => void;
  onFailed?: (error: string) => void;
}

const CONTAINER_ID = "moyasar-payment-container";

export function MoyasarPaymentForm({
  amount,
  description,
  callbackUrl,
  metadata = {},
  publishableKey,
  onCompleted,
  onFailed,
}: MoyasarPaymentFormProps) {
  const isInitialized = useRef(false);
  const metadataRef = useRef(metadata);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    if (isInitialized.current) return;
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!publishableKey || !callbackUrl) return;

    const tryInit = () => {
      if (!window.Moyasar) {
        setError(true);
        setLoading(false);
        return;
      }

      const el = document.getElementById(CONTAINER_ID);
      if (!el) {
        setError(true);
        setLoading(false);
        return;
      }

      // Clear any previous content
      el.innerHTML = "";

      try {
        window.Moyasar.init({
          element: `#${CONTAINER_ID}`,
          amount: Math.round(amount * 100),
          currency: "SAR",
          description,
          publishable_api_key: publishableKey,
          callback_url: callbackUrl,
          methods: ["creditcard"],
          supported_networks: ["visa", "mastercard", "mada"],
          metadata: metadataRef.current,
          language: "ar",
        });
        isInitialized.current = true;
        setLoading(false);
      } catch (err) {
        console.error("[MoyasarForm] init error:", err);
        setError(true);
        setLoading(false);
      }
    };

    // Wait for DOM paint + SDK readiness
    setTimeout(tryInit, 150);
  }, [amount, description, callbackUrl, publishableKey]);

  const handleRetry = () => {
    isInitialized.current = false;
    setError(false);
    setLoading(true);
    setTimeout(() => {
      if (!window.Moyasar) {
        setError(true);
        setLoading(false);
        return;
      }
      const el = document.getElementById(CONTAINER_ID);
      if (el) el.innerHTML = "";
      try {
        window.Moyasar.init({
          element: `#${CONTAINER_ID}`,
          amount: Math.round(amount * 100),
          currency: "SAR",
          description,
          publishable_api_key: publishableKey,
          callback_url: callbackUrl,
          methods: ["creditcard"],
          supported_networks: ["visa", "mastercard", "mada"],
          metadata: metadataRef.current,
          language: "ar",
        });
        isInitialized.current = true;
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 150);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              تعذّر تحميل نموذج الدفع. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.
            </p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 me-1" />
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ms-2 text-sm text-muted-foreground">جاري تحميل نموذج الدفع...</span>
          </div>
        )}
        {/* Always visible — SDK needs a rendered element to inject into */}
        <div id={CONTAINER_ID} />
      </CardContent>
    </Card>
  );
}
