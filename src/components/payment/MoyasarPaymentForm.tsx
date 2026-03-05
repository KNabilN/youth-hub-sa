import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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

export function MoyasarPaymentForm({
  amount,
  description,
  callbackUrl,
  metadata = {},
  publishableKey,
}: MoyasarPaymentFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    const initForm = () => {
      if (!window.Moyasar || !containerRef.current) return;
      initializedRef.current = true;

      window.Moyasar.init({
        element: containerRef.current,
        amount: Math.round(amount * 100), // convert SAR to halalas
        currency: "SAR",
        description,
        publishable_api_key: publishableKey,
        callback_url: callbackUrl,
        methods: ["creditcard"],
        supported_networks: ["visa", "mastercard", "mada"],
        metadata,
        language: "ar",
      });
    };

    // Check if Moyasar script is already loaded
    if (window.Moyasar) {
      initForm();
      return;
    }

    // Load CSS if not already loaded
    if (!document.querySelector('link[href*="moyasar"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
      document.head.appendChild(link);
    }

    // Load JS if not already loaded
    if (!document.querySelector('script[src*="moyasar"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
      script.async = true;
      script.onload = initForm;
      document.head.appendChild(script);
    } else {
      // Script tag exists but not yet loaded
      const checkInterval = setInterval(() => {
        if (window.Moyasar) {
          clearInterval(checkInterval);
          initForm();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [amount, description, callbackUrl, publishableKey, metadata]);

  return (
    <Card>
      <CardContent className="p-4">
        <div ref={containerRef} className="moyasar-form">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ms-2 text-sm text-muted-foreground">جاري تحميل نموذج الدفع...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
