import { useEffect, useRef, useState, useId } from "react";
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
  amount: number; // in SAR
  description: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  publishableKey: string;
}

const SCRIPT_URL = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
const CSS_URL = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
const SCRIPT_TIMEOUT_MS = 15000;
const MAX_INIT_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export function MoyasarPaymentForm({
  amount,
  description,
  callbackUrl,
  metadata = {},
  publishableKey,
}: MoyasarPaymentFormProps) {
  const uniqueId = useRef(`moyasar-${Math.random().toString(36).slice(2, 10)}`).current;
  const metadataRef = useRef(metadata);
  const initKeyRef = useRef("");
  const retryCountRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const [scriptStatus, setScriptStatus] = useState<"loading" | "ready" | "error">(
    typeof window !== "undefined" && window.Moyasar ? "ready" : "loading"
  );
  const [initError, setInitError] = useState(false);

  // Keep metadata ref up to date without triggering re-init
  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  // --- Script loader with timeout and error handling ---
  useEffect(() => {
    if (window.Moyasar) {
      setScriptStatus("ready");
      return;
    }

    // Load CSS
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      document.head.appendChild(link);
    }

    // Load JS
    const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`) as HTMLScriptElement | null;

    if (existingScript) {
      // Script tag exists but may still be loading
      const poll = window.setInterval(() => {
        if (window.Moyasar) {
          clearInterval(poll);
          setScriptStatus("ready");
        }
      }, 100);
      timersRef.current.push(poll);

      const timeout = window.setTimeout(() => {
        clearInterval(poll);
        if (!window.Moyasar) setScriptStatus("error");
      }, SCRIPT_TIMEOUT_MS);
      timersRef.current.push(timeout);

      return () => {
        clearInterval(poll);
        clearTimeout(timeout);
      };
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;

    const timeout = window.setTimeout(() => {
      if (!window.Moyasar) setScriptStatus("error");
    }, SCRIPT_TIMEOUT_MS);
    timersRef.current.push(timeout);

    script.onload = () => {
      clearTimeout(timeout);
      setScriptStatus("ready");
    };
    script.onerror = () => {
      clearTimeout(timeout);
      setScriptStatus("error");
    };

    document.head.appendChild(script);

    return () => clearTimeout(timeout);
  }, []);

  // --- Init Moyasar form ---
  useEffect(() => {
    if (scriptStatus !== "ready") return;

    // Gate: all inputs must be valid
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!publishableKey || !callbackUrl) return;

    const key = `${uniqueId}-${amount}-${publishableKey}-${callbackUrl}`;
    if (initKeyRef.current === key) return;

    retryCountRef.current = 0;
    setInitError(false);

    const tryInit = () => {
      const el = document.getElementById(uniqueId);
      if (!el || !window.Moyasar) {
        // Retry if DOM not ready yet
        if (retryCountRef.current < MAX_INIT_RETRIES) {
          retryCountRef.current++;
          const t = window.setTimeout(tryInit, RETRY_DELAY_MS);
          timersRef.current.push(t);
        } else {
          setInitError(true);
        }
        return;
      }

      // Clear previous content
      el.innerHTML = "";

      requestAnimationFrame(() => {
        try {
          window.Moyasar.init({
            element: `#${uniqueId}`,
            amount: Math.round(amount * 100), // SAR to halalas
            currency: "SAR",
            description,
            publishable_api_key: publishableKey,
            callback_url: callbackUrl,
            methods: ["creditcard"],
            supported_networks: ["visa", "mastercard", "mada"],
            metadata: metadataRef.current,
            language: "ar",
          });
          // Only lock AFTER successful init
          initKeyRef.current = key;
          setInitError(false);
        } catch (err) {
          console.error("Moyasar.init failed:", err);
          if (retryCountRef.current < MAX_INIT_RETRIES) {
            retryCountRef.current++;
            const t = window.setTimeout(tryInit, RETRY_DELAY_MS);
            timersRef.current.push(t);
          } else {
            setInitError(true);
          }
        }
      });
    };

    // Small delay to ensure DOM is mounted
    const t = window.setTimeout(tryInit, 100);
    timersRef.current.push(t);

    return () => {
      // Don't clear initKeyRef here — only on unmount
    };
  }, [scriptStatus, amount, description, callbackUrl, publishableKey, uniqueId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      initKeyRef.current = "";
      timersRef.current.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
      timersRef.current = [];
    };
  }, []);

  const handleRetry = () => {
    initKeyRef.current = "";
    retryCountRef.current = 0;
    setInitError(false);

    if (!window.Moyasar) {
      // Remove broken script and retry loading
      const oldScript = document.querySelector(`script[src="${SCRIPT_URL}"]`);
      if (oldScript) oldScript.remove();
      setScriptStatus("loading");

      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      const timeout = window.setTimeout(() => {
        if (!window.Moyasar) setScriptStatus("error");
      }, SCRIPT_TIMEOUT_MS);

      script.onload = () => {
        clearTimeout(timeout);
        setScriptStatus("ready");
      };
      script.onerror = () => {
        clearTimeout(timeout);
        setScriptStatus("error");
      };
      document.head.appendChild(script);
    } else {
      // Force re-init by changing scriptStatus briefly
      setScriptStatus("loading");
      requestAnimationFrame(() => setScriptStatus("ready"));
    }
  };

  const showError = scriptStatus === "error" || initError;

  return (
    <Card>
      <CardContent className="p-4">
        {showError ? (
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
        ) : (
          <div id={uniqueId}>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ms-2 text-sm text-muted-foreground">جاري تحميل نموذج الدفع...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
