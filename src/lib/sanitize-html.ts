import DOMPurify from "dompurify";

/** Sanitize rich HTML before rendering with dangerouslySetInnerHTML. */
export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}
