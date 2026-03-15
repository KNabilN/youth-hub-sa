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
  amount: number; // in SAR
  description: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  publishableKey: string;
}

const SCRIPT_URL = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
const CSS_URL = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
const SCRIPT_TIMEOUT_MS = 15000;
const MAX_INIT_RETRIES = 5;
const RETRY_DELAY_MS = 400;

export function MoyasarPaymentForm({
  amount,
  description,
  callbackUrl,
  metadata = {},
  publishableKey,
}: MoyasarPaymentFormProps) {
  const uniqueId = useRef(`moyasar-${Math.random().toString(36).slice(2, 10)}`).current;
  const containerRef = useRef<HTMLDivElement>(null);
  const metadataRef = useRef(metadata);
  const initKeyRef = useRef("");
  const retryCountRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const [scriptStatus, setScriptStatus] = useState<"loading" | "ready" | "error">(
    typeof window !== "undefined" && window.Moyasar ? "ready" : "loading"
  );
  const [initError, setInitError] = useState(false);
  const [formReady, setFormReady] = useState(false);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  // --- Script loader ---
  useEffect(() => {
    if (window.Moyasar) {
      setScriptStatus("ready");
      return;
    }

    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`) as HTMLScriptElement | null;

    if (existingScript) {
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
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!publishableKey || !callbackUrl) return;

    const key = `${uniqueId}-${amount}-${publishableKey}-${callbackUrl}`;
    if (initKeyRef.current === key) return;

    retryCountRef.current = 0;
    setInitError(false);
    setFormReady(false);

    const tryInit = () => {
      const el = containerRef.current;
      if (!el || !window.Moyasar) {
        if (retryCountRef.current < MAX_INIT_RETRIES) {
          retryCountRef.current++;
          const t = window.setTimeout(tryInit, RETRY_DELAY_MS);
          timersRef.current.push(t);
        } else {
          setInitError(true);
        }
        return;
      }

      // Clear any previous Moyasar content
      el.innerHTML = "";

      try {
        window.Moyasar.init({
          element: `#${uniqueId}`,
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
        initKeyRef.current = key;
        setInitError(false);
        setFormReady(true);
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
    };

    const t = window.setTimeout(tryInit, 150);
    timersRef.current.push(t);
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
    setFormReady(false);

    if (!window.Moyasar) {
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
          <>
            {/* Loading spinner — owned by React, OUTSIDE Moyasar's container */}
            {!formReady && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ms-2 text-sm text-muted-foreground">جاري تحميل نموذج الدفع...</span>
              </div>
            )}
            {/* Moyasar's container — EMPTY, React never touches its children */}
            <div
              ref={containerRef}
              id={uniqueId}
              style={{ display: formReady ? "block" : "none" }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
