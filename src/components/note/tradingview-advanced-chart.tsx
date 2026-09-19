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
 * Requires CSP: script-src https://s3.tradingview.com; frame-src https://*.tradingview.com
 */
export function TradingViewAdvancedChart({ symbol, locale, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const widget = widgetRef.current;
    if (!container || !widget) return;

    widget.replaceChildren();
    const scripts = container.querySelectorAll('script[src*="tradingview.com"]');
    scripts.forEach((s) => s.remove());

    const script = document.createElement("script");
    script.src = TV_EMBED_ADVANCED_CHART;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify(buildAdvancedChartEmbedConfig(symbol, locale));
    container.appendChild(script);

    return () => {
      script.remove();
      widget.replaceChildren();
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
          className="text-xs text-zinc-400 hover:text-zinc-400"
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
