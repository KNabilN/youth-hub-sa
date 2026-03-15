import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    Moyasar: {
      init: (config: Record<string, unknown>) => void;
    };
  }
}

interface MoyasarPaymentFormProps {
  amount: number; // in SAR
  description: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  publishableKey: string;
}

const CONTAINER_ID = "moyasar-payment-container";
const CONTAINER_SELECTOR = `#${CONTAINER_ID}`;

export function MoyasarPaymentForm({
  amount,
  description,
  callbackUrl,
  metadata = {},
  publishableKey,
}: MoyasarPaymentFormProps) {
  const metadataRef = useRef(metadata);
  const isInitialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Keep metadata ref up to date without triggering re-init
  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  const initMoyasar = () => {
    if (!amount || amount <= 0 || !publishableKey || !callbackUrl) return;

    const container = document.querySelector(CONTAINER_SELECTOR);
    if (!container) {
      console.error("Moyasar container not found in the DOM.");
      setError(true);
      setLoading(false);
      return;
    }

    container.innerHTML = "";
    isInitialized.current = true;

    try {
      window.Moyasar.init({
        element: CONTAINER_SELECTOR,
        amount: Math.round(amount * 100), // convert SAR to halalas
        currency: "SAR",
        description,
        publishable_api_key: publishableKey,
        callback_url: callbackUrl,
        methods: ["creditcard"],
        supported_networks: ["visa", "mastercard", "mada"],
        metadata: metadataRef.current,
        language: "ar",
      });
      setLoading(false);
      setError(false);
    } catch (err) {
      console.error("Failed to initialize Moyasar:", err);
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!amount || amount <= 0) return;
    isInitialized.current = false;
    setLoading(true);
    setError(false);

    // Load CSS if not already loaded
    if (!document.querySelector('link[href*="moyasar"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.7/dist/moyasar.css";
      document.head.appendChild(link);
    }

    const scheduleInit = () => {
      // Wait for DOM to paint before initializing
      setTimeout(() => {
        if (!isInitialized.current) {
          initMoyasar();
        }
      }, 150);
    };

    // Load JS if not already loaded
    if (window.Moyasar) {
      scheduleInit();
      return;
    }

    if (!document.querySelector('script[src*="moyasar"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.7/dist/moyasar.umd.min.js";
      script.async = true;
      script.onload = scheduleInit;
      script.onerror = () => {
        setError(true);
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      // Script tag exists but SDK not ready yet
      const checkInterval = setInterval(() => {
        if (window.Moyasar) {
          clearInterval(checkInterval);
          scheduleInit();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [amount, description, callbackUrl, publishableKey]);

  const handleRetry = () => {
    isInitialized.current = false;
    setError(false);
    setLoading(true);
    setTimeout(() => initMoyasar(), 150);
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Moyasar injects its form here — keep empty so React doesn't interfere */}
        <div id={CONTAINER_ID} className="w-full" />

        {/* Loading state — separate from Moyasar container */}
        {loading && !error && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ms-2 text-sm text-muted-foreground">جاري تحميل نموذج الدفع...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">تعذر تحميل نموذج الدفع</p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              إعادة المحاولة
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
