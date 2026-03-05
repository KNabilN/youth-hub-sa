import { useEffect, useRef, useState } from "react";
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
  const metadataRef = useRef(metadata);
  const [initialized, setInitialized] = useState(false);

  // Keep metadata ref up to date without triggering re-init
  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const initForm = () => {
      if (!window.Moyasar || !container) return;

      // Clear previous form content
      container.innerHTML = "";

      window.Moyasar.init({
        element: ".moyasar-form",
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
      setInitialized(true);
    };

    // Load CSS if not already loaded
    if (!document.querySelector('link[href*="moyasar"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
      document.head.appendChild(link);
    }

    // Load JS if not already loaded
    if (window.Moyasar) {
      initForm();
      return;
    }

    if (!document.querySelector('script[src*="moyasar"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
      script.async = true;
      script.onload = initForm;
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.Moyasar) {
          clearInterval(checkInterval);
          initForm();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [amount, description, callbackUrl, publishableKey]);

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
