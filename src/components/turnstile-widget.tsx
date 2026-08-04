"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { getTurnstileSiteKey, isTurnstileClientEnabled } from "@/lib/turnstile/config";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (errorCode?: string) => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
  className?: string;
  /** Fired with the Cloudflare error code when the widget can't run at all. */
  onFatalError?: (errorCode: string) => void;
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Cloudflare error codes that retrying never fixes — they mean the sitekey or its
 * allowed-hostname list is wrong, so Cloudflare's own "Unable to connect to website /
 * Troubleshoot" box misleads visitors into blaming their network.
 * https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/
 */
const UNRECOVERABLE_ERROR_CODES = new Set([
  "110100", // invalid sitekey
  "110110", // sitekey not found
  "110200", // domain not authorized
  "400020", // invalid sitekey
  "400070", // sitekey disabled
]);

export function TurnstileWidget({ onToken, className, onFatalError }: TurnstileWidgetProps) {
  const siteKey = getTurnstileSiteKey();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile)
  );
  const [fatalErrorCode, setFatalErrorCode] = useState<string | null>(null);
  const reactId = useId();
  const containerId = `turnstile-${reactId.replace(/:/g, "")}`;

  const handleError = useCallback(
    (errorCode?: string) => {
      onToken(null);
      const code = typeof errorCode === "string" ? errorCode : "";
      if (UNRECOVERABLE_ERROR_CODES.has(code)) {
        setFatalErrorCode(code);
        onFatalError?.(code);
      }
    },
    [onFatalError, onToken]
  );

  const renderWidget = useCallback(() => {
    if (fatalErrorCode) return;
    if (!siteKey || !scriptReady || !containerRef.current || !window.turnstile) {
      return;
    }

    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": handleError,
    });
  }, [fatalErrorCode, handleError, onToken, scriptReady, siteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  if (!siteKey) return null;

  if (fatalErrorCode) {
    return (
      <div className={className} role="alert">
        <p className="text-sm text-destructive">
          Verifikasi keamanan sedang bermasalah di sisi kami (kode {fatalErrorCode}). Bukan
          dari koneksi kamu — coba lagi beberapa saat lagi.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script
        src={SCRIPT_SRC}
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />
      <div
        id={containerId}
        ref={containerRef}
        className={className}
        aria-label="Verifikasi keamanan"
      />
    </>
  );
}

export function isTurnstileClientConfigured(): boolean {
  return isTurnstileClientEnabled();
}
