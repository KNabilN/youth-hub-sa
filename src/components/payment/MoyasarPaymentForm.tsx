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
  const metadataRef = useRef(metadata);
  const initKeyRef = useRef("");

  // Keep metadata ref up to date without triggering re-init
  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Guard: skip if already initialised with same params
    const key = `${amount}-${publishableKey}-${callbackUrl}`;
    if (initKeyRef.current === key) return;

    const doInit = () => {
      if (!window.Moyasar || !container) return;

      // Clear previous form content before re-init
      container.innerHTML = "";
      initKeyRef.current = key;

      requestAnimationFrame(() => {
        try {
          window.Moyasar.init({
            element: container,
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
        } catch (err) {
          console.error("Moyasar initialization failed:", err);
        }
      });
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
      doInit();
      return;
    }

    if (!document.querySelector('script[src*="moyasar"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
      script.async = true;
      script.onload = doInit;
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.Moyasar) {
          clearInterval(checkInterval);
          doInit();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [amount, description, callbackUrl, publishableKey]);

  // Cleanup on unmount — reset guard so remount works
  useEffect(() => {
    return () => {
      initKeyRef.current = "";
    };
  }, []);

  return (
    <Card>
      <CardContent className="p-4">
        <div ref={containerRef}>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ms-2 text-sm text-muted-foreground">جاري تحميل نموذج الدفع...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
