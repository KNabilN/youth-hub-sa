import { useEffect, useRef, useState, useCallback } from "react";
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
}

const SCRIPT_URL = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
const CSS_URL = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
const SCRIPT_TIMEOUT_MS = 15000;
const MOUNT_TIMEOUT_MS = 8000;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const metadataRef = useRef(metadata);
  const initKeyRef = useRef("");
  const retryCountRef = useRef(0);
  const cleanupRef = useRef<(() => void)[]>([]);

  const [scriptStatus, setScriptStatus] = useState<"loading" | "ready" | "error">(
    typeof window !== "undefined" && window.Moyasar ? "ready" : "loading"
  );
  const [initError, setInitError] = useState(false);
  const [formReady, setFormReady] = useState(false);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  const runCleanup = useCallback(() => {
    cleanupRef.current.forEach((fn) => fn());
    cleanupRef.current = [];
  }, []);

  const addTimer = useCallback((id: number, type: "timeout" | "interval") => {
    cleanupRef.current.push(() =>
      type === "timeout" ? clearTimeout(id) : clearInterval(id)
    );
  }, []);

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

    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`) as HTMLScriptElement | null;

    if (existing) {
      const poll = window.setInterval(() => {
        if (window.Moyasar) { clearInterval(poll); setScriptStatus("ready"); }
      }, 100);
      addTimer(poll, "interval");

      const timeout = window.setTimeout(() => {
        clearInterval(poll);
        if (!window.Moyasar) setScriptStatus("error");
      }, SCRIPT_TIMEOUT_MS);
      addTimer(timeout, "timeout");

      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;

    const timeout = window.setTimeout(() => {
      if (!window.Moyasar) setScriptStatus("error");
    }, SCRIPT_TIMEOUT_MS);
    addTimer(timeout, "timeout");

    script.onload = () => { clearTimeout(timeout); setScriptStatus("ready"); };
    script.onerror = () => { clearTimeout(timeout); setScriptStatus("error"); };

    document.head.appendChild(script);
  }, [addTimer]);

  // --- Init Moyasar form with mount verification ---
  useEffect(() => {
    if (scriptStatus !== "ready") return;
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!publishableKey || !callbackUrl) return;

    const key = `${uniqueId}-${amount}-${publishableKey}-${callbackUrl}`;
    if (initKeyRef.current === key) return;

    // Reset for new init attempt
    runCleanup();
    retryCountRef.current = 0;
    setInitError(false);
    setFormReady(false);

    const tryInit = () => {
      const el = containerRef.current;
      if (!el) {
        if (retryCountRef.current < MAX_INIT_RETRIES) {
          retryCountRef.current++;
          const t = window.setTimeout(tryInit, RETRY_DELAY_MS);
          addTimer(t, "timeout");
        } else {
          console.error("[MoyasarForm] Container ref not available after retries");
          setInitError(true);
        }
        return;
      }

      if (!window.Moyasar) {
        console.error("[MoyasarForm] Moyasar global not available");
        setInitError(true);
        return;
      }

      // Clear previous Moyasar content safely
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }

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

        // DO NOT set formReady here — wait for actual content to mount
        startMountVerification(el, key);
      } catch (err) {
        console.error("[MoyasarForm] Moyasar.init threw:", err);
        if (retryCountRef.current < MAX_INIT_RETRIES) {
          retryCountRef.current++;
          const t = window.setTimeout(tryInit, RETRY_DELAY_MS);
          addTimer(t, "timeout");
        } else {
          setInitError(true);
        }
      }
    };

    const startMountVerification = (el: HTMLElement, initKey: string) => {
      // Check if content already mounted (e.g. synchronous init)
      if (el.children.length > 0) {
        initKeyRef.current = initKey;
        setFormReady(true);
        return;
      }

      // Use MutationObserver to detect when Moyasar injects its form/iframe
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0) {
            observer.disconnect();
            clearTimeout(mountTimeout);
            initKeyRef.current = initKey;
            setFormReady(true);
            return;
          }
        }
      });

      observer.observe(el, { childList: true, subtree: true });
      cleanupRef.current.push(() => observer.disconnect());

      // Fallback timeout: if nothing mounts within MOUNT_TIMEOUT_MS
      const mountTimeout = window.setTimeout(() => {
        observer.disconnect();

        // Final check — maybe content was injected but observer missed it
        if (el.children.length > 0) {
          initKeyRef.current = initKey;
          setFormReady(true);
          return;
        }

        console.error("[MoyasarForm] Mount timeout — no content injected after", MOUNT_TIMEOUT_MS, "ms");

        // Retry the entire init if retries remain
        if (retryCountRef.current < MAX_INIT_RETRIES) {
          retryCountRef.current++;
          console.log("[MoyasarForm] Retrying init, attempt", retryCountRef.current);
          tryInit();
        } else {
          setInitError(true);
        }
      }, MOUNT_TIMEOUT_MS);
      addTimer(mountTimeout, "timeout");
    };

    // Small delay to ensure React has committed the container to DOM
    const t = window.setTimeout(tryInit, 100);
    addTimer(t, "timeout");
  }, [scriptStatus, amount, description, callbackUrl, publishableKey, uniqueId, runCleanup, addTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      initKeyRef.current = "";
      runCleanup();
    };
  }, [runCleanup]);

  const handleRetry = useCallback(() => {
    initKeyRef.current = "";
    retryCountRef.current = 0;
    runCleanup();
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
      addTimer(timeout, "timeout");

      script.onload = () => { clearTimeout(timeout); setScriptStatus("ready"); };
      script.onerror = () => { clearTimeout(timeout); setScriptStatus("error"); };
      document.head.appendChild(script);
    } else {
      setScriptStatus("loading");
      requestAnimationFrame(() => setScriptStatus("ready"));
    }
  }, [runCleanup, addTimer]);

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
            {!formReady && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ms-2 text-sm text-muted-foreground">جاري تحميل نموذج الدفع...</span>
              </div>
            )}
            {/* Moyasar's container — React NEVER touches children */}
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
