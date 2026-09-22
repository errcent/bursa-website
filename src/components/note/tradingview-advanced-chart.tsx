"use client";

import { useEffect, useRef } from "react";

import {
  TV_EMBED_ADVANCED_CHART,
  buildAdvancedChartEmbedConfig,
  tradingViewSymbolPageUrl,
  type TvEmbedLocale,
} from "@/lib/note/tradingview/widget-config";

type Props = {
  symbol: string;
  locale: TvEmbedLocale;
  className?: string;
};

/**
 * Advanced Real-Time Chart - official embed widget loader.
 * @see https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/
 *
 * Requires CSP: script-src https://s3.tradingview.com; frame-src https://*.tradingview.com https://*.tradingview-widget.com
 *
 * Mount is deferred one tick so React Strict Mode remount does not leave the
 * TradingView loader querying a detached container (querySelector on null).
 */
export function TradingViewAdvancedChart({ symbol, locale, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const widget = widgetRef.current;
    if (!container || !widget) return;

    let alive = true;
    let script: HTMLScriptElement | null = null;

    const timer = window.setTimeout(() => {
      if (!alive || !containerRef.current || !widgetRef.current) return;

      widget.replaceChildren();
      container.querySelectorAll('script[src*="tradingview.com"]').forEach((s) => s.remove());

      script = document.createElement("script");
      script.src = TV_EMBED_ADVANCED_CHART;
      script.type = "text/javascript";
      script.async = true;
      script.textContent = JSON.stringify(buildAdvancedChartEmbedConfig(symbol, locale));
      container.appendChild(script);
    }, 50);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      script?.remove();
      container.querySelectorAll('script[src*="tradingview.com"]').forEach((s) => s.remove());
    };
  }, [symbol, locale]);

  return (
    <div
      ref={containerRef}
      className={cnContainer(className)}
      style={{ minHeight: 360, height: "100%", width: "100%" }}
      aria-label={symbol}
    >
      <div
        ref={widgetRef}
        className="tradingview-widget-container__widget"
        style={{ height: "calc(100% - 28px)", width: "100%" }}
      />
      <div className="tradingview-widget-copyright py-0.5">
        <a
          href={tradingViewSymbolPageUrl(symbol)}
          rel="noopener nofollow"
          target="_blank"
          className="inline-flex min-h-9 coarse:min-h-11 items-center text-xs text-zinc-400 hover:text-zinc-200"
        >
          TradingView
        </a>
      </div>
    </div>
  );
}

function cnContainer(className?: string) {
  return ["tradingview-widget-container", className].filter(Boolean).join(" ");
}
